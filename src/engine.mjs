export const MATERIALS={sibal:'SIBAL fabric',pmma:'PMMA (acrylic)',nomex:'Nomex III',ethanol:'Ethanol',other:'Other material'};
export const GRAVITIES={microgravity:'Microgravity',lunar:'Lunar gravity',martian:'Martian gravity',earth:'Earth gravity'};
export const DEFAULT_SCENARIO={material:'sibal',geometry:'any',gravity:'microgravity',oxygen:21,airflow:5,pressure:101.3,purpose:'prevention'};
export const WEIGHTS={material:35,geometry:5,gravity:20,oxygen:15,airflow:10,pressure:10,purpose:5};
export const finite=x=>typeof x==='number'&&Number.isFinite(x);
export const fmt=(v,n=1)=>finite(v)?Number(v.toFixed(n)).toString():'Not reported';
export function validateScenario(s){
 const errors={};
 if(!MATERIALS[s.material])errors.material='Choose a material.';
 if(!GRAVITIES[s.gravity])errors.gravity='Choose a gravity condition.';
 for(const [key,min,max,label] of [['oxygen',0,100,'Oxygen must be between 0 and 100%.'],['airflow',0,200,'Airflow must be between 0 and 200 cm/s.'],['pressure',0.01,1000,'Pressure must be greater than 0 and at most 1000 kPa.']])if(!finite(Number(s[key]))||s[key]===''||Number(s[key])<min||Number(s[key])>max)errors[key]=label;
 if(!['any','fabric','film','slab','rod'].includes(s.geometry))errors.geometry='Choose a sample form.';
 if(!['prevention','detection','suppression'].includes(s.purpose))errors.purpose='Choose a research focus.';
 return errors;
}
export function normalizedScenario(s){return {...s,oxygen:Number(s.oxygen),airflow:Number(s.airflow),pressure:Number(s.pressure)};}
export function sourceRuns(study,data){
 if(study.id==='sibal')return data.tests.filter(r=>data.sibal_report_tests.some(x=>x.test_id===r.test_id));
 return data.tests.filter(r=>r.pi===study.pi&&(study.id!=='nomex'||/nomex/i.test(r.material_description)));
}
export function graphPoints(study,data,{axis='airflow',includeFlagged=false,width='any'}={}){
 if(study.id==='sibal'&&axis==='airflow')return data.sibal_report_tests.filter(r=>(includeFlagged||r.default_plot_include)&&(width==='any'||r.sample_width_cm_report===Number(width))).map(r=>({id:r.report_test_id,testId:r.test_id,x:r.oxygen_vol_pct_report,y:r.flow_end_cm_s,start:r.flow_start_cm_s,width:r.sample_width_cm_report,comment:r.comment_reported,category:r.reported_comment_category,flagged:!r.default_plot_include,notes:[r.oxygen_source_warning,r.reuse_status==='reused'?'Reused sample':''].filter(Boolean),page:104,paperPage:96,kind:'report_endpoint'}));
 return sourceRuns(study,data).flatMap(r=>{
   const ox=r.measurements.o2_initial_vol_pct;
   const value=axis==='airflow'?r.air_display_single_cm_s:r.measurements.co_final_ppm.value;
   const gas=r.measurements.co_final_ppm;
   const flagged=(axis==='co'&&gas.qualifier!=='numeric_as_reported')||r.review_fields.includes('o2_initial_vol_pct')||(axis==='airflow'&&value===0);
   if(!finite(ox.value)||!finite(value)||(!includeFlagged&&flagged))return [];
   return [{id:r.test_id,testId:r.test_id,x:ox.value,y:value,start:null,width:null,comment:study.id==='nomex'?'No ignition reported in section 3.1':'Outcome not mapped in this view',category:study.id==='nomex'?'no_ignition_reported':'not_stated',flagged,notes:flagged?['Source reading requires review']:[],page:study.pdfPage,paperPage:study.pages,kind:axis==='co'?'final_co_reading':'single_display_reading'}];
 });
}
export function range(values){const v=values.filter(finite);return v.length?[Math.min(...v),Math.max(...v)]:null;}
export function studyStats(study,data){
 const rows=sourceRuns(study,data);
 const oxygen=study.id==='sibal'?range(data.sibal_report_tests.filter(r=>!r.oxygen_source_warning).map(r=>r.oxygen_vol_pct_report)):range(rows.map(r=>r.measurements.o2_initial_vol_pct.value));
 const flow=study.flowRange||range(rows.map(r=>r.air_display_single_cm_s));
 return {count:rows.length,oxygen,flow,plotCount:graphPoints(study,data).length};
}
export function rankStudy(study,s,data){
 const stats=studyStats(study,data);const dimensions=[];const gaps=[];
 function dim(key,label,status,detail){dimensions.push({key,label,status,detail,points:status==='match'?WEIGHTS[key]:status==='partial'?WEIGHTS[key]/2:0,max:WEIGHTS[key]});}
 const match=study.material===s.material;
 dim('material','Material',match?'match':'mismatch',match?MATERIALS[s.material]:`Tests ${MATERIALS[study.material]}, not ${MATERIALS[s.material]}.`);
 if(!match)gaps.push({type:'material',title:'Different material',detail:`This group tests ${MATERIALS[study.material]}. It cannot establish behavior for ${MATERIALS[s.material]}.`});
 dim('geometry','Sample form',s.geometry==='any'||s.geometry===study.geometry?'match':'mismatch',s.geometry==='any'?`Reported form: ${study.geometry}`:study.geometry===s.geometry?'Same sample form':`Reported form: ${study.geometry}`);
 if(s.geometry!=='any'&&s.geometry!==study.geometry)gaps.push({type:'geometry',title:'Different sample form',detail:`${study.geometry} samples do not directly represent your selected ${s.geometry} geometry.`});
 dim('gravity','Gravity',s.gravity==='microgravity'?'match':'mismatch','Measurements in this imported dataset are from microgravity.');
 if(s.gravity!=='microgravity')gaps.push({type:'gravity',title:'Gravity gap',detail:`No ${GRAVITIES[s.gravity].toLowerCase()} measurements are loaded. The displayed microgravity data are contextual evidence.`});
 const insideO=stats.oxygen&&s.oxygen>=stats.oxygen[0]&&s.oxygen<=stats.oxygen[1];
 dim('oxygen','Oxygen',insideO?'match':stats.oxygen?'partial':'unknown',stats.oxygen?`${fmt(stats.oxygen[0])}–${fmt(stats.oxygen[1])}% in this subset`:'No oxygen range available');
 if(!insideO)gaps.push({type:'oxygen',title:'Oxygen outside observed range',detail:stats.oxygen?`${fmt(s.oxygen)}% is outside this subset’s ${fmt(stats.oxygen[0])}–${fmt(stats.oxygen[1])}% range. No prediction is made beyond it.`:'Oxygen conditions are not available.'});
 const insideF=stats.flow&&s.airflow>=stats.flow[0]&&s.airflow<=stats.flow[1];
 dim('airflow','Airflow',insideF?'match':stats.flow?'partial':'unknown',stats.flow?`${fmt(stats.flow[0])}–${fmt(stats.flow[1])} cm/s; ${study.flowRange?'report range':'single display values only'}`:'No single-value airflow records available');
 if(!insideF)gaps.push({type:'airflow',title:stats.flow?'Airflow outside available range':'Airflow needs interpretation',detail:stats.flow?`Your ${fmt(s.airflow)} cm/s is outside the available range for this group.`:'The imported airflow cells contain changing settings. They are preserved as text.'});
 const sameP=study.pressure!==null&&Math.abs(s.pressure-study.pressure)<=1;
 dim('pressure','Pressure',study.pressure===null?'unknown':sameP?'match':'mismatch',study.pressure===null?'Not available as a run-level field':`Report nominal: ${fmt(study.pressure,3)} kPa absolute`);
 gaps.push(study.pressure===null?{type:'pressure',title:'Pressure not resolved',detail:'No run-level pressure is imported for this group. Pressure matching is unavailable.'}:!sameP?{type:'pressure',title:'Pressure gap',detail:`The report specifies nominal ${fmt(study.pressure,3)} kPa. Your scenario uses ${fmt(s.pressure)} kPa.`}:{type:'coverage',title:'Coverage is discrete',detail:'Matching separate ranges does not establish a test at your exact combination of conditions.'});
 dim('purpose','Research focus',s.purpose==='prevention'?'match':s.purpose==='suppression'?'partial':'mismatch',s.purpose==='prevention'?'Materials flammability evidence':s.purpose==='suppression'?'Extinction mechanisms; no suppressant-performance dataset':'No detector-performance dataset imported');
 if(s.purpose!=='prevention')gaps.push({type:'purpose',title:s.purpose==='detection'?'Detection evidence missing':'Suppression equipment gap',detail:s.purpose==='detection'?'Add SAME/SAME-R measurements to evaluate detector performance.':'Extinction observations do not quantify an extinguisher’s effectiveness. Add relevant suppression datasets.'});
 return {...study,stats,score:Math.round(dimensions.reduce((n,d)=>n+d.points,0)),dimensions,gaps,materialMatch:match};
}
export function rankedStudies(catalog,s,data){return catalog.map(c=>rankStudy(c,s,data)).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));}
export function evidenceBrief(study,s){return {headline:study.materialMatch?`${study.title} is the closest loaded evidence group.`:`No exact material match is loaded for ${MATERIALS[s.material]}.`,summary:study.summary,scope:`${study.stats.count} records · BASS-II report section ${study.section}.`,gaps:study.gaps.map(g=>g.detail),note:'Relevance is a transparent search score, not confidence, fire probability, or a material safety rating.'};}
export function downloadFile(name,content,type='application/json'){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function toCSV(points){const fields=['id','x','y','start','width','comment','flagged','kind','paperPage'];const cell=v=>'"'+String(v??'').replaceAll('"','""')+'"';return [fields.map(cell).join(','),...points.map(p=>fields.map(k=>cell(p[k])).join(','))].join('\r\n');}
