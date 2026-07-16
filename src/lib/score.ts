export interface ScoringCriteria {
    id: string;
    label: string;
    maxScore: number;
}

export const REVIEW_CRITERIA: Record<string, ScoringCriteria[]> = {
    'Review 1': [
        { id: 'idea', label: 'Idea Innovation & Concept', maxScore: 10 },
        { id: 'design', label: 'Design & Architecture', maxScore: 10 },
        { id: 'technical', label: 'Technical Approach', maxScore: 10 },
    ],
    'Review 2': [
        { id: 'development', label: 'Development & Implementation', maxScore: 10 },
        { id: 'functionality', label: 'Functionality & System Design', maxScore: 10 },
        { id: 'team', label: 'Team Collaboration', maxScore: 10 },
    ],
    'Review 3': [
        { id: 'real', label: 'Real-World Feasibility', maxScore: 10 },
        { id: 'presentation', label: 'Presentation & Demo', maxScore: 10 },
        { id: 'overall', label: 'Overall Project Value', maxScore: 10 },
    ],
};

export const ALL_REVIEWS = ['Review 1', 'Review 2', 'Review 3'];

export const getCriteriaForReview = (reviewLabel: string) => {
    return REVIEW_CRITERIA[reviewLabel] || REVIEW_CRITERIA['Review 1'];
};
