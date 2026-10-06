/*
 * VectorDBBench's built-in test cases by case_id (its CaseType list): the dataset, its size and its vector dimensions.
 * A case id not listed here shows as "case <id>"; a custom dataset shows by its own name.
 */
BenchPanel.define('constants/vectorDbCases', [], () => {
  'use strict';

  const CASES = Object.freeze({
    1: { dataset: 'SIFT', size: '500K', dim: 128 },
    2: { dataset: 'GIST', size: '100K', dim: 960 },
    3: { dataset: 'LAION', size: '100M', dim: 768 },
    4: { dataset: 'Cohere', size: '10M', dim: 768 },
    5: { dataset: 'Cohere', size: '1M', dim: 768 },
    6: { dataset: 'Cohere', size: '10M', dim: 768, filter: '1%' },
    7: { dataset: 'Cohere', size: '1M', dim: 768, filter: '1%' },
    8: { dataset: 'Cohere', size: '10M', dim: 768, filter: '99%' },
    9: { dataset: 'Cohere', size: '1M', dim: 768, filter: '99%' },
    10: { dataset: 'OpenAI', size: '500K', dim: 1536 },
    11: { dataset: 'OpenAI', size: '5M', dim: 1536 },
    12: { dataset: 'OpenAI', size: '500K', dim: 1536, filter: '1%' },
    13: { dataset: 'OpenAI', size: '5M', dim: 1536, filter: '1%' },
    14: { dataset: 'OpenAI', size: '500K', dim: 1536, filter: '99%' },
    15: { dataset: 'OpenAI', size: '5M', dim: 1536, filter: '99%' },
    50: { dataset: 'OpenAI', size: '50K', dim: 1536 },
  });

  return { CASES };
});
