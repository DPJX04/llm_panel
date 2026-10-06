(function () {
  'use strict';

  const grading = BenchPanel.require('utils/caseGrading');
  const refusal = BenchPanel.require('utils/refusal');

  function question(overrides) {
    return Object.assign({ id: 'q', category: 'test', question: 'Q?', choices: [], keyFacts: [], answerable: true, declineFacts: [] }, overrides);
  }

  const choice = question({ kind: 'choice', choices: ['NaCl', 'KCl', 'NaOH', 'CaCO3'], reference: 'A' });
  const number = question({ kind: 'number', reference: '215' });
  const fact = question({ kind: 'short', reference: 'Canberra', keyFacts: [['canberra']] });
  const premise = question({ kind: 'short', reference: 'No such prize.', answerable: false, declineFacts: [['there is no nobel', 'fields medal']] });

  function core(grade) {
    return { outcome: grade.outcome, extracted: grade.extracted, formatFollowed: grade.formatFollowed };
  }

  test('grade choice: right letter, wrong letter, no letter', () => {
    assert.deepEqual(core(grading.gradeReply(choice, 'Table salt is sodium chloride.\nAnswer: A')), { outcome: 'correct', extracted: 'A', formatFollowed: true });
    assert.deepEqual(core(grading.gradeReply(choice, 'Answer: B')), { outcome: 'incorrect', extracted: 'B', formatFollowed: true });
    assert.equal(grading.gradeReply(choice, 'Sodium chloride, I believe.').outcome, 'incorrect');
    assert.equal(grading.gradeReply(choice, "I don't know which one.").outcome, 'not-attempted');
  });

  test('grade number: the final number decides; a loose answer still scores but misses the format', () => {
    assert.deepEqual(core(grading.gradeReply(number, '3 h 35 min.\nAnswer: 215')), { outcome: 'correct', extracted: '215', formatFollowed: true });
    assert.deepEqual(core(grading.gradeReply(number, 'It takes 215 minutes.')), { outcome: 'correct', extracted: '215', formatFollowed: false });
    assert.equal(grading.gradeReply(number, 'Answer: 205').outcome, 'incorrect');
  });

  test('grade short: every key fact needed; declining is not attempted', () => {
    assert.equal(grading.gradeReply(fact, 'The capital of Australia is Canberra.').outcome, 'correct');
    assert.equal(grading.gradeReply(fact, 'Sydney.').outcome, 'incorrect');
    assert.equal(grading.gradeReply(fact, "I'm not sure about that.").outcome, 'not-attempted');
  });

  test('grade short: with no key facts the reference itself is the fact', () => {
    const plain = question({ kind: 'short', reference: 'Iron' });
    assert.equal(grading.gradeReply(plain, 'Fe is iron.').outcome, 'correct');
  });

  test('grade false premise: declining or rejecting the premise is correct, inventing an answer is not', () => {
    assert.equal(grading.gradeReply(premise, 'There is no Nobel Prize in Mathematics; the Fields Medal is the closest.').outcome, 'correct');
    assert.equal(grading.gradeReply(premise, "I don't know of any such winner.").outcome, 'correct');
    assert.equal(grading.gradeReply(premise, 'It was won by Jane Doe for her work on primes.').outcome, 'incorrect');
  });

  const label = question({ kind: 'label', choices: ['IT', 'HR', 'Facilities'], text: 'The lift is broken.', reference: 'Facilities' });
  const summary = question({
    kind: 'summary', text: 'Pump on bank B failed; 18 lots moved; a worn bearing caused it.', reference: 'Bank B pump failed from a worn bearing; 18 lots moved.',
    keyFacts: [['pump'], ['bearing'], ['18', 'eighteen']], forbiddenFacts: [['bank a']], maxWords: 12,
  });

  test('grade label: the extracted label must be the reference', () => {
    assert.equal(grading.gradeReply(label, 'Answer: Facilities').outcome, 'correct');
    assert.equal(grading.gradeReply(label, 'Answer: IT').outcome, 'incorrect');
    assert.equal(grading.gradeReply(label, "I can't tell which team.").outcome, 'not-attempted');
  });

  test('grade summary: every key fact needed, a forbidden fact makes it wrong, length is a format check', () => {
    const good = grading.gradeReply(summary, 'A worn bearing broke the pump; eighteen lots moved.');
    assert.deepEqual([good.outcome, good.coverage, good.formatFollowed, good.wordCount], ['correct', 1, true, 9]);
    assert.ok(good.rougeL > 0 && good.rougeL < 1);

    const partial = grading.gradeReply(summary, 'The pump failed and lots were moved.');
    assert.equal(partial.outcome, 'incorrect');
    assert.near(partial.coverage, 1 / 3, 1e-9);

    assert.equal(grading.gradeReply(summary, 'Pump on bank A failed from a bearing; 18 lots moved.').outcome, 'incorrect', 'invented bank A');
    const long = grading.gradeReply(summary, 'The pump on furnace bank B failed because of a worn bearing, and 18 lots were moved to another bank.');
    assert.deepEqual([long.outcome, long.formatFollowed], ['correct', false]);
  });

  test('refusal: only the opening of a reply counts', () => {
    assert.ok(refusal.looksLikeRefusal('I cannot determine that from what I know.'));
    assert.ok(refusal.looksLikeRefusal('I’m not sure.'), 'curly apostrophe');
    assert.ok(!refusal.looksLikeRefusal(`${'The answer is Canberra. '.repeat(20)}I don't know more.`));
  });
})();
