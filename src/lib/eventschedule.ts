export interface ScheduleItem {
    id: string;
    title: string;
    start_time: string;
    location: string;
    description?: string;
}

export const INITIAL_SCHEDULE: ScheduleItem[] = [
    // DAY 0 - TUE, MARCH 24
    { id: '1', title: 'Arrival', start_time: '2026-03-24T07:00:00Z', location: 'SOE-7' },
    { id: '2', title: 'Registrations', start_time: '2026-03-24T07:30:00Z', location: 'SOE-7' },
    { id: '3', title: 'Inauguration', start_time: '2026-03-24T10:00:00Z', location: 'SOE-7' },
    // { id: '4', title: 'Round 1', start_time: '2026-03-24T11:00:00Z', location: 'SOE-7', description: '11:00 am to 12:30 pm' },
    { id: '5', title: 'Lunch', start_time: '2026-03-24T12:30:00Z', location: 'SOE-7', description: '12:30 pm to 2:00 pm' },
    { id: '6', title: 'Round 1 (Evaluation)', start_time: '2026-03-24T14:00:00Z', location: 'SOE-7', description: '2:00 pm to 4:00 pm' },
    { id: '7', title: 'Interview', start_time: '2026-03-24T16:00:00Z', location: 'SOE-7', description: '4:00 pm to 6:00 pm' },
    { id: '8', title: 'Break', start_time: '2026-03-24T18:00:00Z', location: 'SOE-7', description: '6:00 pm to 6:20 pm' },
    // { id: '9', title: 'Ro', start_time: '2026-03-24T18:20:00Z', location: 'SOE-7', description: '6:20 pm to 9:00 pm' },
    { id: '10', title: 'Dinner', start_time: '2026-03-24T21:00:00Z', location: 'SOE-7', description: '9:00 pm to 11:00 pm' },
    // { id: '11', title: 'Round 2', start_time: '2026-03-24T23:00:00Z', location: 'SOE-7', description: '11:00 pm to 4:00 am' },

    // DAY 1 - WED, MARCH 25
    { id: '12', title: 'Round 2 (Evaluation)', start_time: '2026-03-25T04:00:00Z', location: 'SOE-7', description: '4:00 am to 6:00 am' },
    { id: '13', title: 'Fresh up and Breakfast', start_time: '2026-03-25T06:00:00Z', location: 'SOE-7', description: '6:00 am to 8:00 am' },
    { id: '14', title: 'Shortlist announcement', start_time: '2026-03-25T08:00:00Z', location: 'SOE-7' },
    { id: '15', title: 'Final Round', start_time: '2026-03-25T08:30:00Z', location: 'SOE-7', description: '8:30 am to 9:30 am' },
    { id: '16', title: 'Closing Ceremony', start_time: '2026-03-25T10:00:00Z', location: 'SOE-7' },
    { id: '17', title: 'Hackathon Close', start_time: '2026-03-25T11:00:00Z', location: 'SOE-7' },
];
