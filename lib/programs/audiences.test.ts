import { describe, expect, it } from "vitest";
import { programDefinitionSchema } from "./definition";
describe("content age and package metadata",()=>{
  const base={schemaVersion:1,contentType:"TRAINING",locale:"mn",title:"Example",summary:"Example",sections:[{id:"lesson",type:"CONTENT",title:"Lesson",body:"Text"}]};
  it("preserves child, adolescent, adult and senior targets from the website editor",()=>{
    for(const age of ["ALL_AGES","CHILD","ADOLESCENT","ADULT","SENIOR"]){
      const value=programDefinitionSchema.parse({...base,targetAudiences:[age,"FAMILY"],audienceTopics:{FAMILY:"Гэр бүлийн харилцаа, уур амьсгал"}});
      expect(value.targetAudiences).toEqual([age,"FAMILY"]);
      expect(value.audienceTopics?.FAMILY).toBe("Гэр бүлийн харилцаа, уур амьсгал");
    }
  });
  it("leaves old definitions without an invented age",()=>{
    expect(programDefinitionSchema.parse(base).targetAudiences).toBe(undefined);
    expect(programDefinitionSchema.safeParse({...base,targetAudiences:["UNKNOWN"]}).success).toBe(false);
  });
});
