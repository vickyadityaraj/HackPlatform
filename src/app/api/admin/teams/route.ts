import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function PUT(request: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { teamId, teamName, reviewLabel, scores, remarks, isShortlisted, completedReviews, reviewers } = body;

        if (!teamId) {
            return NextResponse.json({ success: false, error: 'Team ID is required' }, { status: 400 });
        }

        // 1. Update Shortlist Status & Completed Reviews
        if (isShortlisted !== undefined || completedReviews !== undefined) {
            const updatePayload: any = {};
            if (isShortlisted !== undefined) updatePayload.is_shortlisted = isShortlisted;
            if (completedReviews !== undefined) updatePayload.completed_reviews = completedReviews;

            const { error: teamErr } = await supabase
                .from('teams')
                .update(updatePayload)
                .eq('id', teamId);

            if (teamErr) throw teamErr;
        }

        // 2. Update Scores (if provided)
        if (reviewLabel && scores) {
            const reviewKey = reviewLabel.toLowerCase().replace(' ', ''); // 'Review 1' -> 'review1'

            const { data: existingScore } = await supabase
                .from('scores')
                .select('*')
                .eq('id', teamId)
                .maybeSingle();

            // Structure the scores payload array (3 criteria: Business, Technical, UX + Remarks)
            const payloadArray: (number | string)[] = [
                scores.business || 0,
                scores.technical || 0,
                scores.ux || 0,
                remarks || ''
            ];

            const scoreUpdate: any = {
                id: teamId,
                team_name: teamName || existingScore?.team_name || 'Unknown Team',
                [reviewKey]: payloadArray
            };

            if (reviewers) {
                scoreUpdate.reviewer = reviewers;
            }

            const { error: scoreErr } = await supabase
                .from('scores')
                .upsert(scoreUpdate, { onConflict: 'id' });

            if (scoreErr) throw scoreErr;

            // Recalculate Final Score
            const { data: latestScores } = await supabase
                .from('scores')
                .select('*')
                .eq('id', teamId)
                .single();

            let newFinalScore = 0;
            if (latestScores) {
                ['review1', 'review2', 'review3'].forEach((rKey) => {
                    const rData = latestScores[rKey];
                    // Updated for 3 criteria
                    if (Array.isArray(rData) && rData.length >= 3) {
                        for (let i = 0; i < 3; i++) {
                            newFinalScore += Number(rData[i]) || 0;
                        }
                    }
                });
            }

            const { error: finalScoreErr } = await supabase
                .from('teams')
                .update({ final_score: newFinalScore })
                .eq('id', teamId);

            if (finalScoreErr) throw finalScoreErr;
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { teamId, githubLink } = body;

        if (!teamId) {
            return NextResponse.json({ success: false, error: 'Team ID is required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('teams')
            .update({ github_link: githubLink || null })
            .eq('id', teamId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
