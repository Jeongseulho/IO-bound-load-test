import { check } from 'k6';
import http from 'k6/http';
import { Trend, Gauge } from 'k6/metrics';
const scenario = __ENV.SCENARIO;

export const options = {
  scenarios: {},
};

// 🔹 증가 구간: startRate → peakRate
const increasingStages = (start, peak, step, stepDuration) =>
  Array.from({ length: (peak - start) / step + 1 }, (_, i) => ({
    duration: stepDuration,
    target: start + i * step,
  }));

// 🔹 감소 구간: peakRate → startRate
const decreasingStages = (start, peak, step, stepDuration) =>
  [...increasingStages(start, peak, step, stepDuration)].reverse();

switch (scenario) {
  case '50_vus_to_200_vus':
    options.scenarios.ramping_vus = {
      executor: 'ramping-vus',
      startVUs: 50,
      stages: [
        { duration: '30s', target: 60 },
        { duration: '30s', target: 70 },
        { duration: '30s', target: 80 },
        { duration: '30s', target: 90 },
        { duration: '30s', target: 100 },
        { duration: '30s', target: 120 },
        { duration: '30s', target: 150 },
        { duration: '30s', target: 200 },
      ],
      gracefulRampDown: '10s',
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
