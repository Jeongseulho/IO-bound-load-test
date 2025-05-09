import { check } from 'k6';
import http from 'k6/http';
import { Trend, Gauge } from 'k6/metrics';
const scenario = __ENV.SCENARIO;

export const options = {
  scenarios: {},
};

switch (scenario) {
  case 'endurance_test_200_rate':
    options.scenarios.endurance_test_200_rate = {
      executor: 'constant-arrival-rate',
      rate: 200,
      timeUnit: '1s',
      duration: '10m',
      preAllocatedVUs: 50,
      maxVUs: 10000,
    };
    break;

  case 'spike_test_300_rate':
    options.scenarios.spike_test_300_rate = {
      executor: 'ramping-arrival-rate',
      startRate: 50,
      timeUnit: '1s',
      stages: [
        {
          duration: '30s',
          target: 300,
        },
        {
          duration: '3m',
          target: 50,
        },
      ],
      preAllocatedVUs: 50,
      maxVUs: 10000,
    };
    break;

  case 'single_request':
    options.scenarios.single_request = {
      executor: 'constant-arrival-rate',
      rate: 1,
      timeUnit: '1s',
      duration: '1s',
      preAllocatedVUs: 1,
      maxVUs: 10,
    };
    break;

  default:
    throw new Error(`Invalid scenario: ${scenario}`);
}

const pure_waiting_time = new Trend('http_req_pure_waiting_seconds');
const pure_waiting_time_gauge = new Gauge(
  'http_req_pure_waiting_seconds_gauge',
);

export default function () {
  let url = 'http://70.12.205.117:13000/proxy';

  let res;

  res = http.post(url);
  const pureWaiting =
    res.timings.waiting - Number(res.headers['External-Api-Time']);

  if (!isNaN(pureWaiting)) {
    pure_waiting_time.add(pureWaiting);
    pure_waiting_time_gauge.add(pureWaiting);
  }

  check(res, {
    'status is 200': (r) => r.status === 200,
    'pureWaiting under 300ms': () => pureWaiting < 300,
  });
}
