import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const file=(relative)=>readFileSync(fileURLToPath(new URL(relative,import.meta.url)),'utf8');
function ratio(fg,bg){
 const rgb=(hex)=>hex.match(/[a-f0-9]{2}/gi).map(ch=>{
  const c=parseInt(ch,16)/255;
  return c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4;
 });
 const luminance=(value)=>{const [r,g,b]=rgb(value.slice(1));return r*0.2126+g*0.7152+b*0.0722;};
 const a=luminance(fg),b=luminance(bg);
 return (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
}
test('issue #18: primary text, input, placeholder and focus palettes meet WCAG AA contrast for standard text',()=>{
 for(const [name,fg,bg] of [
  ['mobile body','#cbd5e1','#111827'],['native editable input','#f8fafc','#0f172a'],
  ['native placeholder','#94a3b8','#0f172a'],['site body','#e8f2ef','#0c141d'],
  ['skip link','#0b1b24','#e3ffc4'],['mobile muted text','#cbd5e1','#0f172a'],
 ]){
  assert.ok(ratio(fg,bg)>=4.5,name+' contrast '+ratio(fg,bg).toFixed(2));
 }
});

test('issue #18: native idea always has an editable typed fallback and screen-reader name',()=>{
 const s=file('../../src/components/IdeaCapture.tsx');
 assert.match(s,/accessibilityLabel="Repo idea, typed input or device dictation"/);
 assert.match(s,/accessibilityHint="You can type an idea/);
 assert.match(s,/<TextInput[\s\S]*onChangeText={onIdeaChange}/);
});
test('issue #18: native repo selector radios expose selected state and name',()=>{
 const s=file('../../src/components/RepoPlanControls.tsx');
 assert.match(s,/accessibilityLabel="Repository name"/);
 assert.equal((s.match(/accessibilityRole="radio"/g)||[]).length,3);
 assert.match(s,/accessibilityState={{ selected: plan.visibility === visibility }}/);
 assert.match(s,/accessibilityState={{ selected: plan.stack === stack }}/);
 assert.match(s,/accessibilityState={{ selected: selectedIssueCount === issueCount }}/);
});
test('issue #18: native issue and saved-draft text fields expose descriptive names',()=>{
 const issues=file('../../src/components/StarterIssuePreviewCard.tsx');
 for(const name of ['Starter issue title','Starter issue body','Starter issue labels, comma separated'])
  assert.ok(issues.includes('accessibilityLabel="'+name+'"'),name+' missing');
 assert.match(issues,/accessibilityState={{ selected: selectedIndex === index }}/);
 const drafts=file('../../src/components/SavedDraftSlotsCard.tsx');
 for(const name of ['Import saved draft Markdown','Saved draft slot name','Export saved draft Markdown, read only'])
  assert.ok(drafts.includes('accessibilityLabel="'+name+'"'),name+' missing');
 const files=file('../../src/components/StarterFilePreviewCard.tsx');
 assert.match(files,/accessibilityState={{ selected }}/);
 assert.match(files,/accessibilityState={{ selected: previewMode === 'edit' }}/);
});
test('issue #18: native public confirmation is an explicitly described checkbox',()=>{
 const s=file('../../src/components/CreateRepoPanel.tsx');
 assert.match(s,/accessibilityRole="checkbox" accessibilityState={{ checked: publicConfirmed }}/);
 assert.match(s,/accessibilityLabel="I understand public repositories are readable by anyone"/);
});
test('issue #18: web has keyboard bypass, main landmark, nav context and readable feedback',()=>{
 const s=file('../src/App.jsx');
 assert.match(s,/className="skip-link" href="#reporider-main"/);
 assert.match(s,/<main id="reporider-main" tabIndex={-1}/);
 assert.match(s,/aria-label="RepoRider primary navigation"/);
 assert.match(s,/aria-current={page===section.id\?'page':undefined}/);
 assert.match(s,/aria-live="polite"/);
 assert.match(s,/Describe your repository idea/);
});
test('issue #18: web explorer selection is not conveyed by color alone',()=>{
 const s=file('../src/AuditObservatory.jsx');
 assert.match(s,/role="group" aria-label="Audit evidence explorer views"/);
 for(const view of ['timeline','inbox','notes'])
  assert.ok(s.includes("aria-pressed={view==='"+view+"'}"),view+' selection missing');
 assert.match(s,/aria-pressed={selected===item}/);
});
test('issue #18: CSS preserves visible focus and supports reduced motion + minimum small-screen targets',()=>{
 const s=file('../src/styles.css');
 assert.match(s,/\.skip-link:focus/);
 assert.match(s,/outline:3px solid #e3ffc4/);
 assert.match(s,/prefers-reduced-motion:reduce/);
 assert.match(s,/min-height:44px/);
});
