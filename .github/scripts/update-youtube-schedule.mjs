import { writeFile } from 'node:fs/promises';

const apiKey = process.env.YOUTUBE_API_KEY;
const channelId = 'UC6M-0y7NSkN9VJiKPR2ZVKA';
const outputPath = new URL('../../schedule.json', import.meta.url);
const quotaReasons = new Set([
  'quotaExceeded',
  'dailyLimitExceeded',
  'dailyLimitExceededUnreg',
  'rateLimitExceeded',
  'userRateLimitExceeded',
]);

if (!apiKey) throw new Error('Missing YOUTUBE_API_KEY repository secret.');

async function request(endpoint, params) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`);
  url.search = new URLSearchParams({ ...params, key: apiKey }).toString();
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok || data.error) {
    const error = new Error(data.error?.message || `YouTube API returned ${response.status}`);
    error.reason = data.error?.errors?.[0]?.reason;
    throw error;
  }
  return data;
}

async function save(data) {
  await writeFile(outputPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

try {
  const search = await request('search', {
    part: 'snippet',
    channelId,
    eventType: 'upcoming',
    type: 'video',
    order: 'date',
    maxResults: '5',
  });
  const ids = (search.items || []).map(item => item.id?.videoId).filter(Boolean);
  let videos = [];

  if (ids.length) {
    const details = await request('videos', {
      part: 'snippet,liveStreamingDetails',
      id: ids.join(','),
    });
    videos = (details.items || []).map(video => ({
      id: video.id,
      title: video.snippet.title,
      thumbnail: video.snippet.thumbnails?.medium?.url || video.snippet.thumbnails?.default?.url || '',
      scheduledStartTime: video.liveStreamingDetails?.scheduledStartTime || null,
      url: `https://www.youtube.com/watch?v=${encodeURIComponent(video.id)}`,
    })).sort((a, b) => new Date(a.scheduledStartTime || 0) - new Date(b.scheduledStartTime || 0));
  }

  await save({ status: 'ok', items: videos });
} catch (error) {
  if (!quotaReasons.has(error.reason)) throw error;
  await save({ status: 'quota_exceeded', items: [] });
}
