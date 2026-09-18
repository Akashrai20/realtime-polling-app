const http = require('http');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:8081';
const TOTAL_VOTES = parseInt(process.env.VOTE_COUNT || '10000', 10);
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '100', 10);

// Use keep-alive HTTP agent for high-performance throughput
const agent = new http.Agent({
  keepAlive: true,
  maxSockets: CONCURRENCY,
  maxFreeSockets: 50,
  timeout: 30000,
});

async function makeRequest(urlPath, method = 'GET', data = null, token = null) {
  const url = new URL(urlPath, BASE_URL);
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const payload = data ? JSON.stringify(data) : null;
  if (payload) {
    headers['Content-Length'] = Buffer.byteLength(payload);
  }

  return new Promise((resolve, reject) => {
    const req = http.request(
      url,
      {
        method,
        headers,
        agent,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(body);
          } catch (e) {
            parsed = body;
          }
          resolve({ statusCode: res.statusCode, data: parsed });
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function getOrCreateAuthToken() {
  const username = `loadtester_${Date.now()}`;
  const password = 'Password123!';

  console.log(`[1/4] Registering test account: ${username}...`);
  const regRes = await makeRequest('/api/auth/register', 'POST', { username, password });
  if (regRes.statusCode === 200 && regRes.data.token) {
    return regRes.data.token;
  }

  console.log(`[1/4] Login fallback...`);
  const loginRes = await makeRequest('/api/auth/login', 'POST', { username, password });
  if (loginRes.data.token) {
    return loginRes.data.token;
  }
  throw new Error(`Failed to obtain JWT token: ${JSON.stringify(loginRes.data)}`);
}

async function createTestPoll(token) {
  console.log(`[2/4] Creating new poll for 10,000 vote benchmark...`);
  const pollInput = {
    question: `10k Load Benchmark Poll (${new Date().toISOString()})`,
    description: 'High-concurrency vote testing with Redis INCR and async Mongo sync',
    options: ['Option A (Golang Engine)', 'Option B (Redis INCR)', 'Option C (Mongo Pipeline)'],
    duration_minutes: 1440,
    restrict_fingerprint: false,
    restrict_ip: false,
  };

  const res = await makeRequest('/api/polls', 'POST', pollInput, token);
  if (res.statusCode !== 200 && res.statusCode !== 201) {
    throw new Error(`Failed to create poll: ${JSON.stringify(res.data)}`);
  }

  const poll = res.data.poll || res.data;
  console.log(`  ✓ Created Poll ID: ${poll.id}`);
  console.log(`  ✓ Options: ${poll.options.map((o) => `${o.id}: ${o.text}`).join(' | ')}`);
  return poll;
}

async function runBenchmark(pollId, options) {
  console.log(`\n[3/4] Launching benchmark: ${TOTAL_VOTES.toLocaleString()} votes with concurrency level ${CONCURRENCY}...`);

  const optionIds = options.map((o) => o.id);
  let successCount = 0;
  let failCount = 0;
  let completedCount = 0;

  const startTime = Date.now();
  let lastReportTime = startTime;

  // Worker queue
  let currentIndex = 0;

  async function worker(workerId) {
    while (true) {
      let voteIndex;
      if (currentIndex >= TOTAL_VOTES) break;
      voteIndex = currentIndex++;

      const selectedOptionId = optionIds[voteIndex % optionIds.length];
      const fingerprint = `fp_bench_${voteIndex}_${Math.random().toString(36).substr(2, 6)}`;

      try {
        const res = await makeRequest(`/api/polls/${pollId}/vote`, 'POST', {
          poll_id: pollId,
          option_id: selectedOptionId,
          voter_fingerprint: fingerprint,
        });

        if (res.statusCode === 200) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (err) {
        failCount++;
      }

      completedCount++;

      // Progress reporting every 1,000 votes or 10%
      if (completedCount % 1000 === 0 || completedCount === TOTAL_VOTES) {
        const now = Date.now();
        const elapsedSec = (now - startTime) / 1000;
        const currentRps = (completedCount / elapsedSec).toFixed(1);
        const progressPct = ((completedCount / TOTAL_VOTES) * 100).toFixed(0);
        console.log(
          `  ➜ Progress: ${completedCount.toLocaleString()}/${TOTAL_VOTES.toLocaleString()} (${progressPct}%) | Elapsed: ${elapsedSec.toFixed(
            2
          )}s | Throughput: ${currentRps} req/sec`
        );
      }
    }
  }

  // Spawn concurrency workers
  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(worker(i));
  }

  await Promise.all(workers);
  const totalDurationMs = Date.now() - startTime;
  const totalSec = totalDurationMs / 1000;
  const avgRps = (TOTAL_VOTES / totalSec).toFixed(2);

  return {
    totalVotes: TOTAL_VOTES,
    successCount,
    failCount,
    totalDurationMs,
    totalSec,
    avgRps,
  };
}

async function verifyResults(pollId) {
  console.log(`\n[4/4] Verifying final vote state in database...`);
  // Small delay to allow async Mongo sync routines to complete
  await new Promise((r) => setTimeout(r, 1000));

  const res = await makeRequest(`/api/polls/${pollId}`, 'GET');
  if (res.statusCode === 200) {
    const poll = res.data.poll;
    console.log(`\n======================================================`);
    console.log(`              POLL STATE AFTER BENCHMARK              `);
    console.log(`======================================================`);
    console.log(` Poll ID     : ${poll.id}`);
    console.log(` Question    : ${poll.question}`);
    console.log(` Total Votes : ${poll.total_votes?.toLocaleString() || poll.totalVotes?.toLocaleString()}`);
    console.log(` Breakdowns  :`);
    poll.options.forEach((opt) => {
      console.log(`   - [${opt.id}] ${opt.text}: ${opt.votes.toLocaleString()} votes`);
    });
    console.log(`======================================================\n`);
    return poll;
  } else {
    console.error(`Failed to fetch final poll status:`, res.data);
  }
}

async function main() {
  console.log(`======================================================`);
  console.log(`    HCL REAL-TIME POLLING ENGINE - 10K VOTE TEST      `);
  console.log(`======================================================`);
  console.log(` Target API   : ${BASE_URL}`);
  console.log(` Total Votes  : ${TOTAL_VOTES.toLocaleString()}`);
  console.log(` Concurrency  : ${CONCURRENCY}`);
  console.log(`======================================================\n`);

  try {
    const token = await getOrCreateAuthToken();
    const poll = await createTestPoll(token);
    const benchResults = await runBenchmark(poll.id, poll.options);

    await verifyResults(poll.id);

    console.log(`======================================================`);
    console.log(`                BENCHMARK SUMMARY                     `);
    console.log(`======================================================`);
    console.log(` Total Votes Cast   : ${benchResults.totalVotes.toLocaleString()}`);
    console.log(` Successful (200 OK): ${benchResults.successCount.toLocaleString()}`);
    console.log(` Failed / Errors    : ${benchResults.failCount.toLocaleString()}`);
    console.log(` Total Time         : ${benchResults.totalSec.toFixed(2)} seconds`);
    console.log(` Throughput (RPS)   : ${benchResults.avgRps} req/sec`);
    console.log(`======================================================\n`);
  } catch (err) {
    console.error(`❌ Benchmark failed with error:`, err);
    process.exit(1);
  }
}

main();
