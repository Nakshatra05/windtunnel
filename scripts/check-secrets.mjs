import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const secrets=readFileSync('.env.local','utf8').split(/\r?\n/).filter(l=>/^(PRIVATE_KEY|FIXTURE_MAKER_KEY)=/.test(l)).map(l=>l.slice(l.indexOf('=')+1).trim()).filter(Boolean);
const files=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const bad=[];
for(const f of files){if(f==='.env.local'){bad.push(f);continue;}let body;try{body=readFileSync(f,'utf8');}catch{continue;}if(secrets.some(s=>body.includes(s)||body.includes(s.replace(/^0x/,''))))bad.push(f);}
if(bad.length){console.error('Signing material found in tracked files:',bad.join(', '));process.exitCode=1;}else console.log(`Secret scan passed for ${files.length} tracked files. Signing material remains local.`);
