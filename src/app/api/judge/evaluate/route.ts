import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { REVIEW_CRITERIA } from '@/lib/score';

export async function POST(request: Request) {
    try {
        const session = await getSession();

        if (!session || !session.userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        if (session.role !== 'judge' && session.role !== 'admin' && session.role !== 'coordinator') {
            return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
        }

        const body = await request.json();
        const { teamId, teamName, reviewLabel, scores, remarks } = body;

        if (!teamId || !reviewLabel || !scores) {
            return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
        }

        const reviewIndex = reviewLabel === 'Review 1' ? 0 : reviewLabel === 'Review 2' ? 1 : 2;
        const reviewKey = reviewLabel === 'Review 1' ? 'review1' : reviewLabel === 'Review 2' ? 'review2' : 'review3';

        // 1. Fetch current scores to update the right phase
        const { data: existingScore } = await supabase
            .from('scores')
            .select('*')
            .eq('id', teamId)
            .maybeSingle();

        const newReviewerArr = [...(existingScore?.reviewer || ['-', '-', '-'])].map(String);
        newReviewerArr[reviewIndex] = session.name;

        const criteria = REVIEW_CRITERIA[reviewLabel as keyof typeof REVIEW_CRITERIA];
        if (!criteria) {
            return NextResponse.json({ success: false, error: 'Invalid review phase' }, { status: 400 });
        }

        const reviewPayload: (number | string)[] = criteria.map(c => scores[c.id] || 0);
        reviewPayload.push(remarks || '');

        const { error: scoreError } = await supabase
            .from('scores')
            .upsert({
                id: teamId,
                team_name: teamName,
                reviewer: newReviewerArr,
                [reviewKey]: reviewPayload
            }, { onConflict: 'id' });

        if (scoreError) throw scoreError;

        // 2. Prep updates for teams table
        const { data: teamData } = await supabase
            .from('teams')
            .select('completed_reviews')
            .eq('id', teamId)
            .single();

        const updatedCompletedReviews = Array.from(new Set([...(teamData?.completed_reviews || []), reviewLabel]));

        const { data: latestScores } = await supabase
            .from('scores')
            .select('*')
            .eq('id', teamId)
            .single();

        let newFinalScore = 0;
        if (latestScores) {
            ['Review 1', 'Review 2', 'Review 3'].forEach((rLabel, idx) => {
                const rData = latestScores[`review${idx + 1}`];
                const crit = REVIEW_CRITERIA[rLabel as keyof typeof REVIEW_CRITERIA];
                if (Array.isArray(rData) && rData.length >= crit.length) {
                    crit.forEach((_, i) => {
                        newFinalScore += Number(rData[i]) || 0;
                    });
                }
            });
        }

        const { error: teamError } = await supabase
            .from('teams')
            .update({
                completed_reviews: updatedCompletedReviews,
                final_score: newFinalScore
            })
            .eq('id', teamId);

        if (teamError) throw teamError;

        return NextResponse.json({
            success: true,
            data: {
                completed_reviews: updatedCompletedReviews,
                final_score: newFinalScore
            }
        });
    } catch (err: any) {
        console.error('API Error updating judge score:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
