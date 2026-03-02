import { AppSpecs, GeneratedApp } from '../types';

const VETR_SYSTEM_PROMPT = `You are an expert self-debugging coding agent. Your only goal is to solve the given programming task correctly, producing clean, efficient, well-tested code.

Follow this strict VETR loop for EVERY coding task or code modification. Never output final code until the loop completes successfully. Think step-by-step and be extremely disciplined.

Core rules you MUST obey:
• Assume your first version is wrong until proven correct by tests.
• Explanation before repair is mandatory — it dramatically improves quality.
• Make minimal, targeted changes (diff-style when possible).
• Prefer cheap/fast signals first: syntax → static types → unit tests → integration.
• Debugging power decays after 4–5 turns → detect stagnation and reset.
• Always try to generate new falsifying tests when coverage is weak.
• Output format is rigid — never skip or reorder sections.

Phase 0 – Fast Filters (always first)
Run static analysis in your mind or describe what would fail (syntax, obvious type errors, linter issues). If any, list them immediately and jump to Phase 2.

Phase 1 – Verification Gate
Analyze all available feedback and tests.
If EVERY test passes, coverage looks reasonable (≥70–80% branches where applicable), no linter/static errors remain, and logic seems sound:
   → Output ONLY:
     FINAL ANSWER
     \`\`\`json
     { "summary": "...", "files": [...] }
     \`\`\`
Confidence: X/100
Remaining concerns: (list if any, or "none")
→ Then STOP.
Otherwise → continue to debugging.

Phase 2 – Structured Reflection & Explanation (critical — do this thoroughly)
Output exactly these labeled sections:
A. BUG HYPOTHESIS LIST
(at least 3–5 concrete, specific hypotheses)
B. MOST LIKELY ROOT CAUSE
One-sentence summary + detailed reasoning referencing failing inputs/outputs/errors
C. WRONG CODE EXPLANATION
Go line-by-line or block-by-block through the current code.
Explain WHAT is wrong and WHY it fails (use variable tracing examples).
D. KEY PATH SIMULATION / DRY-RUN
Pick 1–3 important failing or edge-case inputs.
Simulate execution step-by-step, tracking 3–5 critical variables.
Show expected vs actual behavior.
E. PROPOSED FIX STRATEGY
Bullet-point plan of minimal changes (function names, logic flips, guards, etc.).
Do NOT write full code yet.

Phase 3 – Generate Repair
Output ONLY the repair in diff-like or block-replacement format:
diff- old line
+ new line
—or—
// Replace lines 23–45 with:
new code block here
Add inline comments where assumptions are made or where verification is still needed.

Phase 4 – Self-Generated Test Ideas (when test suite is weak or no new coverage gained)
Propose 2–4 new unit/property/metamorphic test cases that try to BREAK the current code.
Format:
TEST NAME: should_...
GIVEN: ...
WHEN: ...
THEN: ...

Phase 5 – Next Validation
Describe exactly what needs to be re-executed (all tests + your new ones).
If this is iteration ≥4 and <20% improvement (fewer failures, new tests passing), or same error persists → TRIGGER RESET:
RESET SUMMARY:
Summarize all attempts so far (100–150 words).
Then say: "Strategic reset: restarting from clean context with refined understanding."

Phase 6 – Loop Control
After repair → go back to Phase 1 with updated code + new feedback.`;

export async function generateWithGrok(
  specs: AppSpecs,
  onProgress?: (msg: string) => void
): Promise<GeneratedApp> {
  const apiKey = process.env.GROK_KEY || process.env.GEMINI_API_KEY;
  
  let currentCode = "No code generated yet.";
  let feedback = "Initial generation request. No code has been produced yet.";
  let iteration = 1;
  const maxIterations = 5;
  let history: string[] = [];

  const taskDescription = `
Generate a comprehensive Next.js 14+ (App Router) and Supabase boilerplate.
Objective: ${specs.objective}
Users & Roles: ${specs.roles}
Data & Models: ${specs.dataModels}
Constraints: ${specs.constraints}
Branding: ${specs.branding}
Pages & Navigation: ${specs.pages}
Integrations: ${specs.integrations}
Success Criteria: ${specs.doneState}

Requirements:
- Use Tailwind CSS for styling.
- Implement Supabase Auth (email/password).
- Define SQL schema for Supabase (tables, RLS policies).
- Create core Next.js pages and components.
- Use Lucide React for icons.
- Output MUST be a JSON object: { "summary": string, "files": Array<{path, content, language}> }
`;

  while (iteration <= maxIterations) {
    onProgress?.(`> Starting VETR Iteration ${iteration}/${maxIterations}...`);
    
    const prompt = `
Current task:
««TASK_DESCRIPTION»»
${taskDescription}

Existing code / previous version (if any):
««PREVIOUS_CODE»»
${currentCode}

Existing tests / test feedback / error messages / coverage report:
««FEEDBACK»»
${feedback}

Now execute the VETR loop.
`;

    try {
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'grok-code-fast-1',
          messages: [
            { role: 'system', content: VETR_SYSTEM_PROMPT },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        throw new Error(`Grok API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      history.push(content);

      if (content.includes('FINAL ANSWER')) {
        onProgress?.(`> VETR Loop Complete: Final Answer Received.`);
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[0]) as GeneratedApp;
          } catch (e) {
             onProgress?.(`> Error parsing JSON from FINAL ANSWER. Attempting to recover...`);
             // Try to find the last JSON block if the first one failed
             const jsonBlocks = content.match(/\{[\s\S]*?\}/g);
             if (jsonBlocks) {
               for (const block of jsonBlocks.reverse()) {
                 try {
                   return JSON.parse(block) as GeneratedApp;
                 } catch (innerE) { continue; }
               }
             }
          }
        }
        throw new Error("Could not parse JSON from Final Answer");
      }

      if (content.includes('TRIGGER RESET')) {
        onProgress?.(`> VETR Strategic Reset Triggered.`);
        feedback = "Strategic reset: restarting from clean context with refined understanding. Previous attempts failed to show significant improvement.";
        // We don't actually clear currentCode unless we want a true fresh start, 
        // but the prompt says "restarting from clean context".
        // Let's keep the task description but clear the code.
        currentCode = "No code generated yet (Reset).";
      } else {
        onProgress?.(`> VETR Phase 2-5: Self-Reflecting and Repairing...`);
        
        // Extract any code blocks for the next iteration
        // We look for the "repair" section or any code blocks
        const codeBlocks = content.match(/```[\s\S]*?```/g);
        if (codeBlocks) {
          // If there are multiple blocks, the last one is usually the most updated one in a repair turn
          currentCode = codeBlocks[codeBlocks.length - 1].replace(/```[a-z]*\n|```/g, '');
        }
        
        feedback = `Self-reflection from iteration ${iteration}:\n${content.substring(0, 1000)}...`;
      }
      
      iteration++;
      
    } catch (error) {
      onProgress?.(`> VETR Loop Error: ${error instanceof Error ? error.message : 'Unknown'}`);
      throw error;
    }
  }

  throw new Error("VETR loop exceeded maximum iterations without a final answer.");
}
