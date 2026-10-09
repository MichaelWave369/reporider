/**
 * Issue #22: canonical, offline repository naming policy.
 *
 * A suggested name is a convenience; an edited name is never silently changed.
 * Names are not proof of GitHub availability. No network or write methods here.
 */
export const MAX_REPO_NAME_LENGTH=96;
export const REPO_NAME_PATTERN=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DISALLOWED=new Set([
 'git','github','null','undefined','none','unknown','untitled','new','con','prn','aux','nul',
 ...Array.from({length:9},(_,i)=>'com'+(i+1)),
 ...Array.from({length:9},(_,i)=>'lpt'+(i+1)),
]);
export type RepositoryNameIssue='EMPTY'|'TOO_LONG'|'NON_CANONICAL'|'RESERVED'|null;
export type RepositoryNameValidation={
 valid:boolean;
 issue:RepositoryNameIssue;
 message:string;
};
export function validateRepositoryName(name:unknown):RepositoryNameValidation{
 if(typeof name!=='string'||name.length===0)
  return{valid:false,issue:'EMPTY',message:'Enter a repository name.'};
 if(name.length>MAX_REPO_NAME_LENGTH)
  return{valid:false,issue:'TOO_LONG',message:'Repository name must be 96 characters or fewer.'};
 if(!REPO_NAME_PATTERN.test(name))
  return{valid:false,issue:'NON_CANONICAL',message:'Use lowercase letters, numbers, and single hyphens; start and end with a letter or number.'};
 if(DISALLOWED.has(name))
  return{valid:false,issue:'RESERVED',message:'That name is reserved or confusing. Choose a more specific project name.'};
 return{valid:true,issue:null,message:'Name format is valid. GitHub availability has not been checked.'};
}
export function suggestedRepositoryName(text:string):string{
 const raw=text.normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
  .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
 const prefix=raw.slice(0,MAX_REPO_NAME_LENGTH).replace(/-+$/,'');
 const candidate=prefix||'new-idea-repo';
 const proposed=DISALLOWED.has(candidate)?(candidate+'-starter').slice(0,MAX_REPO_NAME_LENGTH):candidate;
 return validateRepositoryName(proposed).valid?proposed:'new-idea-repo';
}
/**
 * A user-supplied set is never proof of availability; it can only flag a
 * definite matching name within that set. Private/hidden repos are invisible.
 */
export type KnownNameCollision='UNKNOWN'|'POTENTIAL_CONFLICT'|'NOT_IN_SUPPLIED_LIST'|'INVALID_NAME';
export function inspectKnownRepositoryNames(name:string,names?:readonly string[]):KnownNameCollision{
 if(!validateRepositoryName(name).valid)return 'INVALID_NAME';
 if(!names)return 'UNKNOWN';
 if(names.some(item=>typeof item==='string'&&item.toLowerCase()===name))return 'POTENTIAL_CONFLICT';
 return 'NOT_IN_SUPPLIED_LIST';
}
/**
 * Explicit prewrite qualification contract for a future authenticated writer.
 * A local plan or unauthenticated listing never qualifies a name for writing.
 * The real writer must perform its own fresh identity/scopes/existence check.
 */
export type RepositoryNamePrewriteGate={
 name:string;
 format_valid:boolean;
 name_collision_unverified:true;
 may_create_repository:false;
 required_next_gate:'AUTHENTICATED_OWNER_SCOPED_EXISTENCE_CHECK';
};
export function getRepositoryNamePrewriteGate(name:string):RepositoryNamePrewriteGate{
 return{
  name,format_valid:validateRepositoryName(name).valid,
  name_collision_unverified:true,may_create_repository:false,
  required_next_gate:'AUTHENTICATED_OWNER_SCOPED_EXISTENCE_CHECK',
 };
}
