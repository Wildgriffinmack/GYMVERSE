// Traffic-source attribution for TikTok, Instagram, YouTube Shorts, paid ads, gym flyers, campus and creators.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyChannel, parseAttribution } from "../lib/attribution.ts";

const channel = (search, referrer = "", host = "gymverse.app") => parseAttribution(search, referrer, host).channel;

describe("channel classification", () => {
  it("organic social from UTM tags", () => {
    assert.equal(channel("?utm_source=tiktok&utm_medium=social&utm_campaign=beta_waitlist"), "tiktok");
    assert.equal(channel("?utm_source=instagram&utm_medium=reels"), "instagram");
    assert.equal(channel("?utm_source=ig&utm_medium=bio"), "instagram");
    assert.equal(channel("?utm_source=youtube&utm_medium=shorts"), "youtube_shorts");
    assert.equal(channel("?utm_source=yt"), "youtube_shorts");
  });
  it("organic social from referrer when UTM tags are missing", () => {
    assert.equal(channel("", "https://www.tiktok.com/@gymverse"), "tiktok");
    assert.equal(channel("", "https://l.instagram.com/?u=x"), "instagram");
    assert.equal(channel("", "https://m.youtube.com/shorts/abc"), "youtube_shorts");
    assert.equal(channel("", "https://youtu.be/abc"), "youtube_shorts");
  });
  it("paid ads win over the platform name", () => {
    assert.equal(channel("?utm_source=tiktok&utm_medium=paid_social&utm_content=hook_a"), "paid");
    assert.equal(channel("?utm_source=meta&utm_medium=cpc"), "paid");
  });
  it("gym flyer QR codes, campus promotion and creator posts", () => {
    assert.equal(channel("?utm_source=gym_ironhouse&utm_medium=qr&utm_campaign=flyer_nov"), "gym_flyer_qr");
    assert.equal(channel("?utm_source=flyer&utm_medium=print"), "gym_flyer_qr");
    assert.equal(channel("?utm_source=campus_ucla&utm_medium=qr"), "campus");
    assert.equal(channel("?utm_source=tabling&utm_campaign=campus_week"), "campus");
    assert.equal(channel("?utm_source=jaytrains&utm_medium=creator"), "creator");
    assert.equal(channel("?utm_source=creator_maya"), "creator");
  });
  it("direct, referral and unknown sources", () => {
    assert.equal(channel(""), "direct");
    assert.equal(channel("", "https://news.example.org/post"), "referral");
    assert.equal(channel("", "https://gymverse.app/#waitlist"), "direct", "own-site referrer is not a referral");
    assert.equal(channel("", "https://www.gymverse.app/", "gymverse.app"), "direct");
    assert.equal(channel("?utm_source=newsletter"), "other");
  });
  it("is case-insensitive and ignores junk", () => {
    assert.equal(channel("?utm_source=TikTok&utm_medium=Social"), "tiktok");
    assert.equal(channel("", "not a url"), "direct");
    assert.equal(classifyChannel({}, ""), "direct");
  });
});

describe("parseAttribution", () => {
  it("keeps normalized UTM values, trimmed to 100 chars", () => {
    const a = parseAttribution(`?utm_source=TikTok&utm_campaign=${"x".repeat(150)}&v=2&fbclid=abc`, "", "gymverse.app");
    assert.deepEqual(Object.keys(a.utm).sort(), ["utm_campaign", "utm_source"]);
    assert.equal(a.utm.utm_source, "tiktok");
    assert.equal(a.utm.utm_campaign.length, 100);
  });
  it("records the referrer host without www", () => {
    assert.equal(parseAttribution("", "https://www.instagram.com/p/1", "gymverse.app").referrerHost, "instagram.com");
  });
});
