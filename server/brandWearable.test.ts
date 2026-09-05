import {describe,it,expect} from 'vitest';
import {wearableBrief,ASSET_PATTERN} from './brandWearable';
import {emptyIntake} from '../src/domain/brandIntake';
import {validateDocuments} from '../src/domain/brandProfile';
const input={fields:{...emptyIntake,name:'织回',offers:'再生围巾'},profile:{documents:[{id:'doc1',name:'品牌.txt',text:'织回提供再生围巾'}],evidence:[{field:'name',documentId:'doc1',quote:'织回'},{field:'offers',documentId:'doc1',quote:'再生围巾'}],gaps:[],summary:'示例'}};
describe('reference-preserving wearable request',()=>{
  it('requires sourced brand identity and products before generating',()=>{
    expect(wearableBrief(input).prompt).toContain('fixed base character');
    expect(()=>wearableBrief({...input,profile:{...input.profile,evidence:[]}})).toThrow();
  });
  it('rejects remote or traversing visual references',()=>{
    expect(ASSET_PATTERN.test('/api/collider/avatar-assets/../../secrets.png')).toBe(false);
    expect(()=>validateDocuments([{...input.profile.documents[0],visualRef:'https://example.com/private.jpg'}])).toThrow();
  });
});
