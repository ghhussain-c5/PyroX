import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {graphPoints,rankedStudies,validateScenario,DEFAULT_SCENARIO,sourceRuns,toCSV} from '../src/engine.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../public/data/BASS_II_data.json',import.meta.url)));
const catalog=JSON.parse(fs.readFileSync(new URL('../src/catalog.json',import.meta.url)));
const sibal=catalog.find(s=>s.id==='sibal');
test('preserves 129 unique records and separates the 27 BASS-II fabric tests',()=>{
 assert.equal(data.tests.length,129);assert.equal(new Set(data.tests.map(r=>r.test_id)).size,129);
 assert.equal(sourceRuns(sibal,data).length,27);
 assert.equal(sourceRuns(catalog.find(s=>s.id==='nomex'),data).length,3);
});
test('default comparison excludes exactly the reused and uncertain table observations',()=>{
 const points=graphPoints(sibal,data);assert.equal(points.length,17);
 assert.equal(graphPoints(sibal,data,{includeFlagged:true}).length,27);
 for(const p of points){const r=data.sibal_report_tests.find(r=>r.report_test_id===p.id);assert.equal(p.y,r.flow_end_cm_s);assert.equal(p.x,r.oxygen_vol_pct_report);assert.ok(r.default_plot_include);}
 assert.ok(graphPoints(sibal,data,{width:'1.2'}).every(p=>p.width===1.2));
});
test('different fuels and gravity never become direct experimental evidence',()=>{
 const ranked=rankedStudies(catalog,{...DEFAULT_SCENARIO,material:'ethanol',gravity:'lunar'},data);
 assert.ok(ranked.every(s=>!s.materialMatch&&s.gaps.some(g=>g.type==='material')&&s.gaps.some(g=>g.type==='gravity')));
 assert.ok(ranked.every(s=>s.score>=0&&s.score<=100));
 assert.equal(rankedStudies(catalog,DEFAULT_SCENARIO,data)[0].id,'sibal');
});
test('rejects empty, nonphysical, and nonfinite scenario values',()=>{
 for(const v of ['',NaN,Infinity,-1,101])assert.ok(validateScenario({...DEFAULT_SCENARIO,oxygen:v}).oxygen);
 assert.deepEqual(validateScenario(DEFAULT_SCENARIO),{});
 assert.ok(validateScenario({...DEFAULT_SCENARIO,pressure:0}).pressure);
});
test('CSV preserves quoted text and has consistent columns',()=>{
 assert.match(toCSV([{id:'a',comment:'a,"b"'}]),/"a,""b"""/);
});
