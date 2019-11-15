#!/usr/bin/env node

const fetch = require('node-fetch');

const flatMap = (arr, fn) => arr.reduce((xs, x) => xs.concat(fn(x)), []);

const codeByAssignmentCode = {
  'competitor': '1',
  'staff-judge': 'J',
  'staff-scrambler': 'S',
  'staff-runner': 'R',
};

const tasksCsvString = async (competitionId) => {
  const response = await fetch(
    `https://worldcubeassociation.org/api/v0/competitions/${competitionId}/wcif/public`
  );
  const wcif = await response.json();
  const rooms = flatMap(wcif.schedule.venues, venue => venue.rooms);
  const roundActivities = flatMap(wcif.events, event =>
    flatMap(rooms, room =>
      room.activities.filter(({ activityCode }) =>
        activityCode.startsWith(event.id)
      )
    )
  );
  const groupActivities = flatMap(
    roundActivities.filter(round => round.childActivities.length > 0),
    roundActivity => roundActivity.childActivities
  );
  const header = [
    'ID',
    'Name',
    'Country',
    'WCA ID',
    ...groupActivities.map(group => group.activityCode),
  ];
  const rows = wcif.persons
    .filter(person => person.registration)
    .map(person => {
      const groupCodes = groupActivities.map(groupActivity => {
        const assignment = person.assignments.find(
          assignment => assignment.activityId === groupActivity.id
        );
        return assignment ? codeByAssignmentCode[assignment.assignmentCode] : '0';
      });
      return [
        person.registrantId,
        person.name,
        person.countryIso2,
        person.wcaId,
        ...groupCodes,
      ];
    });

  return [header, ...rows].map(row => row.join(',')).join('\n');
};

const [, , competitionId] = process.argv;
if (!competitionId) {
  console.log('Missing argument: competition id.');
  process.exit(1);
}

tasksCsvString(competitionId)
  .then(csv => console.log(csv))
  .catch(error => console.error(`Something went wrong: ${error}`));
