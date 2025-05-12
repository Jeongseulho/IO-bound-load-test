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
  case 'constant_20_rps_20s':
    options.scenarios.constant_20_rps = {
      executor: 'constant-arrival-rate',
      rate: 20, // 초당 요청 수
      timeUnit: '1s', // 요청 속도 단위
      duration: '20s', // 총 테스트 시간
      preAllocatedVUs: 50, // 기본 할당 VUs
      maxVUs: 1000, // 요청 처리용 최대 VUs (충분히 크게 설정)
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
