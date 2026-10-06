/*
 * A small built-in question set, so an accuracy run works with nothing to load. The questions are written for this
 * panel rather than copied from public benchmarks, which models may have memorised. Every answer can be checked by
 * hand. For a serious comparison, load a larger set (see question-sets/ in the repository).
 */
BenchPanel.define('constants/starterQuestionSet', [], () => {
  'use strict';

  function number(id, question, reference) {
    return { id, kind: 'number', category: 'math', question, reference };
  }

  function choice(id, category, question, choices, reference) {
    return { id, kind: 'choice', category, question, choices, reference };
  }

  function fact(id, category, question, reference, keyFacts) {
    return { id, kind: 'short', category, question, reference, keyFacts };
  }

  function classify(id, question, labels, text, reference) {
    return { id, kind: 'label', category: 'classification', question, labels, text, reference };
  }

  function summarize(id, text, reference, keyFacts, forbiddenFacts, maxWords) {
    return { id, kind: 'summary', category: 'summarization', question: 'Summarize the following text.', text, reference, keyFacts, forbiddenFacts, maxWords };
  }

  const SENTIMENT = ['positive', 'negative', 'neutral'];
  const TEAMS = ['IT', 'HR', 'Facilities', 'Finance'];
  const EMAIL_PURPOSE = ['question', 'complaint', 'order', 'thanks'];
  const LOG_TYPES = ['equipment fault', 'process deviation', 'material shortage', 'safety incident'];

  function falsePremise(id, question, reference, declineFacts) {
    return { id, kind: 'short', category: 'false premise', question, reference, answerable: false, declineFacts };
  }

  const STARTER_QUESTION_SET = Object.freeze({
    id: 'starter-v1',
    title: 'Starter set',
    description: 'Math word problems, multiple choice across science, computing and logic, short facts, classification of tickets, reviews and fab log entries, summaries of short work texts, and false-premise questions a model should decline.',
    questions: [
      number('m01', 'A shop sells pens at 3 for $4. How many dollars do 27 pens cost?', '36'),
      number('m02', 'A train leaves at 09:40 and arrives at 13:15 the same day. How many minutes does the trip take?', '215'),
      number('m03', 'Lena has 5 times as many marbles as Omar. Together they have 84 marbles. How many marbles does Lena have?', '70'),
      number('m04', 'A rectangle is 18 cm long and its perimeter is 58 cm. What is its area in square centimetres?', '198'),
      number('m05', 'A tank holds 1,200 litres and is 35% full. How many more litres are needed to fill it?', '780'),
      number('m06', 'An item costs $250. Its price rises by 20% and then the new price falls by 20%. What does it cost now, in dollars?', '240'),
      number('m07', 'What is the sum of all whole numbers from 1 to 120?', '7260'),
      number('m08', 'A lot holds 25 wafers. A fab starts 14 lots and scraps 3% of all those wafers, rounded down to a whole wafer. How many wafers are scrapped?', '10'),
      number('m09', 'Three machines each make 45 parts per hour. Two of them run for 8 hours and the third runs for 5 hours. How many parts are made in total?', '945'),
      number('m10', 'A recipe needs 250 g of flour for 4 people. How many grams of flour are needed for 10 people?', '625'),
      number('m11', 'If 7x - 5 = 3x + 27, what is x?', '8'),
      number('m12', 'A car travels 150 km in 1 hour 40 minutes. What is its average speed in km per hour?', '90'),

      choice('c01', 'science', 'What is the chemical formula of table salt?', ['NaCl', 'KCl', 'NaOH', 'CaCO3'], 'A'),
      choice('c02', 'science', 'Which gas makes up most of Earth\'s atmosphere by volume?', ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Argon'], 'C'),
      choice('c03', 'computing', 'How many bits are in one byte?', ['4', '8', '16', '32'], 'B'),
      choice('c04', 'computing', 'Which data structure works on a last-in, first-out basis?', ['Queue', 'Stack', 'Heap', 'Hash table'], 'B'),
      choice('c05', 'computing', 'What is the time complexity of binary search on a sorted array of n items?', ['O(n)', 'O(n log n)', 'O(log n)', 'O(1)'], 'C'),
      choice('c06', 'science', 'Which element is the main material of most semiconductor wafers?', ['Germanium', 'Silicon', 'Gallium', 'Carbon'], 'B'),
      choice('c07', 'reasoning', 'All bloops are razzies, and all razzies are lazzies. Which statement must be true?',
        ['All lazzies are bloops', 'All bloops are lazzies', 'No bloops are lazzies', 'Some razzies are not bloops'], 'B'),
      choice('c08', 'math', 'What is the derivative of x^3 with respect to x?', ['3x^2', 'x^2', '3x', 'x^4 / 4'], 'A'),
      choice('c09', 'computing', 'Which HTTP status code means "Not Found"?', ['200', '301', '404', '500'], 'C'),
      choice('c10', 'math', 'A fair six-sided die is rolled twice. What is the probability that both rolls are 6?', ['1/6', '1/12', '1/36', '1/18'], 'C'),
      choice('c11', 'math', 'Which of these is a prime number?', ['51', '57', '61', '63'], 'C'),
      choice('c12', 'science', 'Water boils at 100 °C at sea level. What is that in degrees Fahrenheit?', ['180', '212', '232', '100'], 'B'),

      fact('s01', 'general knowledge', 'What is the capital city of Australia?', 'Canberra', [['canberra']]),
      fact('s02', 'science', 'Which chemical element has the symbol Fe?', 'Iron', [['iron']]),
      fact('s03', 'general knowledge', 'Who wrote the play "Romeo and Juliet"?', 'William Shakespeare', [['shakespeare']]),
      fact('s04', 'math', 'How many sides does a hexagon have?', 'Six', [['6', 'six']]),
      fact('s05', 'computing', 'What does the abbreviation CPU stand for?', 'Central Processing Unit', [['central processing unit']]),
      fact('s06', 'general knowledge', 'What is the largest ocean on Earth?', 'The Pacific Ocean', [['pacific']]),

      classify('k01', 'What is the overall sentiment of this product review?', SENTIMENT,
        'The laptop arrived two days late and the box was dented, but it works perfectly and the battery easily lasts a full workday. I would buy it again.', 'positive'),
      classify('k02', 'What is the overall sentiment of this product review?', SENTIMENT,
        'Stopped charging after a week. Support never replied to my three emails. Avoid.', 'negative'),
      classify('k03', 'What is the overall sentiment of this product review?', SENTIMENT,
        'The package contains the cable, the adapter and a printed manual. Setup took about ten minutes.', 'neutral'),
      classify('k04', 'Which team should handle this support ticket?', TEAMS,
        'My laptop cannot connect to the VPN since this morning\'s update; I get error 809.', 'IT'),
      classify('k05', 'Which team should handle this support ticket?', TEAMS,
        'The air conditioning in meeting room 3B has been leaking water onto the floor since Monday.', 'Facilities'),
      classify('k06', 'Which team should handle this support ticket?', TEAMS,
        'I was charged twice for the same hotel stay on my last business trip and need the duplicate expense reversed.', 'Finance'),
      classify('k07', 'Which team should handle this support ticket?', TEAMS,
        'I would like to move the start of my parental leave from March to April.', 'HR'),
      classify('k08', 'What is the main purpose of this email?', EMAIL_PURPOSE,
        'Please ship 200 units of part X-17 to our Dresden site by 14 March. Purchase order 4471 is attached.', 'order'),
      classify('k09', 'What is the main purpose of this email?', EMAIL_PURPOSE,
        'Thank you for the quick turnaround on the last batch. The whole team really appreciated it.', 'thanks'),
      classify('k10', 'Which category does this production log entry belong to?', LOG_TYPES,
        'Etch tool E-04 stopped mid-run with a vacuum pump alarm. Maintenance has been called.', 'equipment fault'),
      classify('k11', 'Which category does this production log entry belong to?', LOG_TYPES,
        'The photoresist for line 2 will run out tomorrow, and the next delivery is delayed by a week.', 'material shortage'),
      classify('k12', 'Which category does this production log entry belong to?', LOG_TYPES,
        'An operator slipped on a wet floor near the wet bench. First aid was given and the area was cordoned off.', 'safety incident'),

      summarize('x01',
        'On Tuesday 4 March at 02:15, the cooling water pump for furnace bank B failed. The night shift moved 18 wafer lots to bank C, and no wafers were scrapped. The pump was replaced by 09:30 and bank B returned to production at 11:00 after qualification runs. Maintenance traced the failure to a worn bearing and will now inspect all pumps of that model every three months instead of every six.',
        'A cooling pump on furnace bank B failed early on 4 March; 18 lots were moved to bank C with no scrap. The pump was replaced and the bank was back in production by 11:00. A worn bearing caused it, so pumps of that model will be inspected every three months.',
        [['pump'], ['bank b', 'furnace'], ['18', 'eighteen'], ['bearing'], ['three months', '3 months', 'quarterly', 'every 3']],
        [['bank a', 'bank d'], ['16 lots', '19 lots', '20 lots']], 60),
      summarize('x02',
        'Project Atlas weekly meeting, 12 May. The team agreed to move the pilot launch from 2 June to 16 June, because the supplier\'s sensor boards arrived with the wrong firmware. Priya will re-flash all 40 boards by 30 May. The budget stays at 85,000 euros. The next meeting is on 19 May.',
        'The Atlas pilot moves from 2 to 16 June because the sensor boards came with the wrong firmware. Priya will re-flash the 40 boards by 30 May, and the budget stays at 85,000 euros.',
        [['16 june', 'june 16', '16th june', 'june 16th', '16th of june'], ['firmware'], ['priya'], ['40', 'forty'], ['85,000', '85000', '85k']],
        [['9 june', 'june 9', '23 june', 'june 23', '2 july', 'july 2']], 50),
      summarize('x03',
        'Starting 1 October, the company canteen will open at 07:00 instead of 07:30 and will add a vegetarian hot meal every day. Prices stay the same. The salad bar will close for two weeks in November for renovation.',
        'From 1 October the canteen opens at 07:00 instead of 07:30 and serves a daily vegetarian hot meal at unchanged prices. The salad bar closes for two weeks of renovation in November.',
        [['1 october', 'october 1', '1st october', 'october 1st'], ['07:00', '7:00', '7 am', '7am'], ['vegetarian'], ['salad bar'], ['november']],
        [['price increase', 'prices will rise', 'prices rise', 'prices go up', 'more expensive', 'higher prices']], 45),
      summarize('x04',
        'Shift handover, line 2, night to day. Lithography stepper L2-03 is down for a lamp change and should be back by 10:00; twelve lots are waiting at litho because of it. Implanter I-01 passed its daily check. Lot 7Q5521 is on hold for a particle excursion and needs an engineering review before release.',
        'Stepper L2-03 is down for a lamp change until about 10:00, leaving 12 lots waiting at litho. Implanter I-01 passed its check. Lot 7Q5521 is on hold for particles pending engineering review.',
        [['l2-03', 'l203'], ['lamp'], ['12', 'twelve'], ['7q5521'], ['particle']],
        [['i-01 failed', 'implanter failed', 'failed its daily check', 'failed the daily check', 'failed its check']], 50),
      summarize('x05',
        'We compare three quantization methods for a 7-billion-parameter language model served on one GPU. 4-bit AWQ kept 98% of the full-precision accuracy and doubled throughput, while 4-bit GPTQ kept 96% with a similar speed-up. 8-bit quantization kept 99.5% of the accuracy but improved throughput by only 30%. We recommend AWQ when memory is the main constraint.',
        'On a 7B model on one GPU, 4-bit AWQ kept 98% of accuracy and doubled throughput, GPTQ kept 96% with a similar speed-up, and 8-bit kept 99.5% but sped up only 30%. AWQ is recommended when memory is the limit.',
        [['awq'], ['98'], ['gptq'], ['8-bit', 'int8', 'eight bit', '8 bits'], ['30']],
        [['recommend gptq', 'recommends gptq', 'gptq is recommended', 'gptq is best']], 55),
      summarize('x06',
        'From next Monday, visitors to the cleanroom must be registered at reception at least 24 hours in advance, instead of on the day. Visitors must also watch a ten-minute safety video before entering. Contractors with a valid annual badge are exempt from both rules.',
        'From next Monday, cleanroom visitors must be registered at reception 24 hours ahead and watch a ten-minute safety video first. Contractors with a valid annual badge are exempt.',
        [['24 hours', '24h', '24 hrs', 'a day ahead', 'a day in advance', 'one day'], ['video'], ['contractor'], ['exempt', 'excus', 'do not need', 'don t need', 'not required', 'not need']],
        [['48 hours', '48h', 'two days']], 40),

      falsePremise('u01', 'Who won the Nobel Prize in Mathematics in 2019?', 'There is no Nobel Prize in Mathematics.',
        [['no nobel prize in math', 'no nobel prize for math', 'there is no nobel', 'is not a nobel', 'isn t a nobel',
          'does not award', 'doesn t award', 'not awarded', 'fields medal', 'abel prize']]),
      falsePremise('u02', 'What was the name of the first person to walk on Mars?', 'No one has walked on Mars.',
        [['no one has', 'nobody has', 'no human has', 'no person has', 'no humans have', 'not yet', 'has not walked',
          'hasn t walked', 'have not walked', 'haven t walked', 'never walked']]),
      falsePremise('u03', 'What is the exact population of the city of Atlantis today?', 'Atlantis is a legend; it has no population.',
        [['myth', 'legend', 'fiction', 'fictitious', 'imaginary', 'not a real', 'does not exist', 'doesn t exist', 'never existed']]),
      falsePremise('u04', 'In which year did Albert Einstein win his second Nobel Prize?', 'He won only one Nobel Prize (Physics, 1921).',
        [['only one', 'only won one', 'one nobel', 'a single nobel', 'never won a second', 'did not win a second',
          'didn t win a second', 'no second']]),
    ],
  });

  return { STARTER_QUESTION_SET };
});
