#!/usr/bin/env node

const fetch = require('node-fetch');

const getNoShows = async (competitionId) => {
  const response = await fetch(
    `https://worldcubeassociation.org/api/v0/competitions/${competitionId}/wcif/public`
  );
  const wcif = await response.json();
  const allResults = wcif.events
    .flatMap(event => event.rounds)
    .flatMap(round => round.results);
  const participantIds = Array.from(new Set(
    allResults.map(result => result.personId)
  ));
  const noShows = wcif.persons
    .filter(person => person.registration && person.registration.status === 'accepted')
    .filter(person => !participantIds.includes(person.registrantId));
  return noShows;
};

const [, , competitionId] = process.argv;
if (!competitionId) {
  console.log('Missing argument: competition id.');
  process.exit(1);
}

getNoShows(competitionId)
  .then(noShows => console.log(
    noShows.map(person => `${person.name} | ${person.wcaId || 'No WCA ID'}`).join('\n')
  ))
  .catch(error => console.error(`Something went wrong: ${error}`));
