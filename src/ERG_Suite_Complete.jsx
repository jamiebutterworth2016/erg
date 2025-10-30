import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  Target,
  Code,
  Copy,
  Plus,
  FolderOpen,
  LayoutDashboard,
  Users,
  Briefcase,
  ChevronRight,
  Building2,
  Globe,
  TrendingUp,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Trash2,
} from "lucide-react";

export const ERGRecruitmentSystem = () => {
  // Safe localStorage operations
  const safeLocalStorage = {
    getItem: (key) => {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        console.error("localStorage.getItem failed:", e);
        return null;
      }
    },
    setItem: (key, value) => {
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (e) {
        console.error("localStorage.setItem failed:", e);
        return false;
      }
    },
    removeItem: (key) => {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (e) {
        console.error("localStorage.removeItem failed:", e);
        return false;
      }
    },
  };

  const [mode, setMode] = useState("home"); // 'home', 'recruitment', 'candidate-to-market'
  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [currentStage, setCurrentStage] = useState("project-home");
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [pdfJsReady, setPdfJsReady] = useState(false);
  const lastApiCallRef = useRef(0);

  const [formData, setFormData] = useState({
    companyUrl: "",
    companyInfo: "",
    additionalNotes: "",
    uploadedFile: null,
    fileContent: "",
  });

  const [customization, setCustomization] = useState({
    linkedinTone: "professional",
    linkedinLength: 300,
    briefTone: "professional",
    briefLength: 2000,
    emailTone: "professional",
    emailLength: 100,
    elevatorTone: "professional",
    elevatorLength: 150,
  });

  const [processing, setProcessing] = useState({
    fileUpload: false,
    contentGeneration: false,
    cvAnalysis: false,
    competencyGeneration: false,
    interviewGeneration: false,
    interviewQuestionsGeneration: false,
    motivationAnalysis: false,
    technicalOverviewGeneration: false,
  });

  const [generatedContent, setGeneratedContent] = useState({
    linkedinAdvert: "",
    candidateBrief: "",
    emailBullets: "",
    elevatorPitch: "",
    evp: "",
  });

  const [validationData, setValidationData] = useState({
    selectedLanguage: "",
    yearsExperience: "",
    competencies: [],
    candidateEvidence: "",
    validationQuestions: "",
    customLanguage: "",
    interviewQuestions: "",
    interviewTranscript: "",
    topSkills: [],
    candidateTranscripts: {}, // New: stores transcripts per candidate
    technicalOverviews: {}, // New: stores technical analysis per candidate
  });

  const [interviewData, setInterviewData] = useState({
    selectedCandidate: "",
    duration: "",
    format: "",
    focus: "",
    agenda: "",
    hiringPriorities: "",
    professionalBrief: "",
    coachingBrief: "",
    checklist: "",
  });

  // Candidate to Market state
  const [ctmStage, setCtmStage] = useState(1);
  const [ctmCvFile, setCtmCvFile] = useState(null);
  const [ctmIndustry, setCtmIndustry] = useState("");
  const [ctmSummaries, setCtmSummaries] = useState(null);
  const [ctmEmployerUrl, setCtmEmployerUrl] = useState("");
  const [ctmSector, setCtmSector] = useState("");
  const [ctmAnalysis, setCtmAnalysis] = useState(null);
  const [ctmLoading, setCtmLoading] = useState(false);
  const [ctmTone, setCtmTone] = useState("professional");
  const [ctmLength, setCtmLength] = useState("medium");
  const [ctmProjects, setCtmProjects] = useState(() => {
    const stored = safeLocalStorage.getItem("ctmProjects");
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Failed to parse CTM projects:", e);
      return [];
    }
  });
  const [currentCtmProjectId, setCurrentCtmProjectId] = useState(null);
  const [newCtmProjectName, setNewCtmProjectName] = useState("");
  const [showCtmProjectList, setShowCtmProjectList] = useState(true);

  const currentCtmProject = ctmProjects.find(
    (p) => p.id === currentCtmProjectId
  );
  const [ctmCopied, setCtmCopied] = useState({
    technical: false,
    industry: false,
    softwareList: false,
    industryList: false,
  });

  const [cvFiles, setCvFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);
  const cvFileInputRef = useRef(null);

  const currentProject = projects.find((p) => p.id === currentProjectId);
  const FILE_SIZE_LIMIT = 10 * 1024 * 1024;

  const saveToStorage = (data) => {
    try {
      safeLocalStorage.setItem("ergRecruitmentProjects", JSON.stringify(data));
    } catch (e) {
      console.error("Storage error");
    }
  };

  const loadFromStorage = () => {
    try {
      const saved = safeLocalStorage.getItem("ergRecruitmentProjects");
      if (!saved) return [];

      const parsed = JSON.parse(saved);

      // Validate it's an array
      if (!Array.isArray(parsed)) {
        console.error("Invalid localStorage data: not an array");
        return [];
      }

      return parsed;
    } catch (e) {
      console.error("Failed to load from localStorage:", e);
      return [];
    }
  };

  useEffect(() => {
    const saved = loadFromStorage();
    if (saved.length > 0) setProjects(saved);

    const loadPdf = async () => {
      if (window.pdfjsLib) {
        setPdfJsReady(true);
        return;
      }
      try {
        const script = document.createElement("script");
        script.src =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
        await new Promise((resolve, reject) => {
          script.onload = () => {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc =
              "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
            resolve();
          };
          script.onerror = reject;
          document.body.appendChild(script);
        });
        setPdfJsReady(true);
      } catch (e) {
        console.error("PDF load failed");
      }
    };
    loadPdf();
  }, []);

  useEffect(() => {
    if (projects.length > 0) saveToStorage(projects);
  }, [projects]);

  useEffect(() => {
    if (ctmProjects.length > 0)
      safeLocalStorage.setItem("ctmProjects", JSON.stringify(ctmProjects));
  }, [ctmProjects]);

  useEffect(() => {
    if (currentProject) {
      setFormData({
        companyUrl: currentProject.companyUrl || "",
        companyInfo: currentProject.companyInfo || "",
        additionalNotes: currentProject.additionalNotes || "",
        uploadedFile: null,
        fileContent: currentProject.fileContent || "",
      });
      setGeneratedContent({
        linkedinAdvert: currentProject.linkedinAdvert || "",
        candidateBrief: currentProject.candidateBrief || "",
        emailBullets: currentProject.emailBullets || "",
        elevatorPitch: currentProject.elevatorPitch || "",
        evp: currentProject.evp || "",
      });
      setValidationData({
        selectedLanguage: currentProject.selectedLanguage || "",
        yearsExperience: currentProject.yearsExperience || "",
        competencies: currentProject.competencies || [],
        candidateEvidence: currentProject.candidateEvidence || "",
        validationQuestions: currentProject.validationQuestions || "",
        customLanguage: currentProject.customLanguage || "",
        interviewQuestions: currentProject.interviewQuestions || "",
        interviewTranscript: currentProject.interviewTranscript || "",
        topSkills: currentProject.topSkills || [],
      });
      setInterviewData({
        selectedCandidate: currentProject.interviewSelectedCandidate || "",
        duration: currentProject.interviewDuration || "",
        format: currentProject.interviewFormat || "",
        focus: currentProject.interviewFocus || "",
        agenda: currentProject.interviewAgenda || "",
        hiringPriorities: currentProject.interviewHiringPriorities || "",
        professionalBrief: currentProject.professionalBrief || "",
        coachingBrief: currentProject.coachingBrief || "",
        checklist: currentProject.checklist || "",
      });
    }
  }, [currentProjectId, currentProject]);

  useEffect(() => {
    if (!currentProjectId) return;
    const timer = setTimeout(() => {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === currentProjectId
            ? {
                ...p,
                ...formData,
                ...generatedContent,
                ...validationData,
                interviewSelectedCandidate: interviewData.selectedCandidate,
                interviewDuration: interviewData.duration,
                interviewFormat: interviewData.format,
                interviewFocus: interviewData.focus,
                interviewAgenda: interviewData.agenda,
                interviewHiringPriorities: interviewData.hiringPriorities,
                professionalBrief: interviewData.professionalBrief,
                coachingBrief: interviewData.coachingBrief,
                checklist: interviewData.checklist,
                lastUpdated: new Date().toISOString(),
              }
            : p
        )
      );
    }, 2000);
    return () => clearTimeout(timer);
  }, [
    currentProjectId,
    formData,
    generatedContent,
    validationData,
    interviewData,
  ]);

  const createProject = () => {
    if (!newProjectName.trim()) return;
    const newProj = {
      id: Date.now().toString(),
      clientName: newProjectName.trim(),
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      companyUrl: "",
      companyInfo: "",
      additionalNotes: "",
      fileContent: "",
      linkedinAdvert: "",
      candidateBrief: "",
      emailBullets: "",
      elevatorPitch: "",
      selectedLanguage: "",
      yearsExperience: "",
      competencies: [],
      candidateEvidence: "",
      validationQuestions: "",
      customLanguage: "",
      cvAnalyses: [],
      candidateTranscripts: {},
      technicalOverviews: {},
    };
    setProjects((prev) => [...prev, newProj]);
    setCurrentProjectId(newProj.id);
    setNewProjectName("");
    setShowNewProjectModal(false);
    setCurrentStage("overview");
  };

  const handleFileUpload = async (file) => {
    if (!file || file.size > FILE_SIZE_LIMIT) {
      setErrors((prev) => ({ ...prev, fileUpload: "File too large" }));
      return;
    }
    setProcessing((prev) => ({ ...prev, fileUpload: true }));
    try {
      const ext = file.name.split(".").pop().toLowerCase();
      let content = "";
      if (ext === "pdf" && pdfJsReady) {
        const buf = await file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const text = await page.getTextContent();
          content += text.items.map((item) => item.str).join(" ") + " ";
        }
      } else if (ext === "txt") {
        content = await file.text();
      }
      if (content.length < 50) throw new Error("File too short");
      setFormData((prev) => ({
        ...prev,
        uploadedFile: file,
        fileContent: content,
      }));
    } catch (e) {
      setErrors((prev) => ({ ...prev, fileUpload: "Read failed" }));
    } finally {
      setProcessing((prev) => ({ ...prev, fileUpload: false }));
    }
  };

  const apiCall = async (prompt, maxTokens = 2000) => {
    const now = Date.now();
    if (now - lastApiCallRef.current < 2000) {
      await new Promise((r) =>
        setTimeout(r, 2000 - (now - lastApiCallRef.current))
      );
    }
    lastApiCallRef.current = Date.now();
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    return data.content[0].text;
  };

  const generateAllContent = async () => {
    if (!formData.fileContent) {
      setErrors((prev) => ({ ...prev, generation: "Add job description" }));
      return;
    }
    setProcessing((prev) => ({ ...prev, contentGeneration: true }));
    try {
      const linkedinPrompt = `You are an expert Technical Recruitment Copywriter specialising in LinkedIn-optimised job adverts for software and technology roles across the UK.

INPUT DATA:
Company URL: ${formData.companyUrl || "Not provided"}
Company Info/EVP: ${formData.companyInfo || "Not provided"}
Job Description: ${formData.fileContent.substring(0, 2000)}
Additional Notes: ${formData.additionalNotes || "None"}

CREATE A ${customization.linkedinLength}-WORD LINKEDIN POST WITH:

STRUCTURE (mandatory sections with emojis):
⭐ Job Title & Intro (2-3 sentences introducing the opportunity)
🚀 Why Join? (4-6 bullet points highlighting benefits, culture, growth)
🧩 The Role (2-3 sentences on day-to-day impact)
🎯 What You Need (bullet points of key requirements)

CRITICAL ANONYMISATION RULES - STRICTLY ENFORCE:
1. NEVER EVER mention the company name - not even once
2. NEVER mention the industry sector they serve (e.g., don't say "fintech", "healthcare", "e-commerce", "proptech" etc.)
3. NEVER mention what market/customers they serve (e.g., "serving financial institutions", "working with retailers")
4. Use ONLY generic descriptors: "this organisation", "this business", "this team", "our client", "this forward-thinking company", "an established software house"
5. Focus on: tech stack, engineering culture, working practices, team structure, growth opportunities - NOT what business domain they operate in
6. Remove any sector-specific terminology that reveals the industry
7. If the job description mentions clients/customers in a specific sector, omit those references entirely

STYLE RULES:
8. Use first-person recruiter voice - authentic, professional, informal
9. Bold key phrases and role titles with ** markdown
10. Include relevant emojis throughout for engagement
11. Highlight tech stack, role impact, and team culture FIRST - not HR jargon
12. Write like a seasoned recruiter writing for engineering peers
13. Every sentence must earn its place - clarity, flow, engagement essential
14. NO call-to-action like "Apply now"
15. NO placeholder text - all content must be authentic and natural
16. Tone: ${customization.linkedinTone}

EXAMPLE OF GOOD ANONYMISATION:
❌ BAD: "Join this leading fintech revolutionising payments for SMEs"
✅ GOOD: "Join this growing scale-up building modern, cloud-native solutions"

❌ BAD: "Working with healthcare providers to improve patient outcomes"
✅ GOOD: "Building impactful products used by thousands of users daily"

OUTPUT: Single LinkedIn post, ${
        customization.linkedinLength
      } words, structured sections, bold text, emojis, professional yet human tone, COMPLETELY ANONYMISED.`;

      const li = await apiCall(linkedinPrompt, 2500);
      setGeneratedContent((prev) => ({ ...prev, linkedinAdvert: li }));

      const briefPrompt = `Create a ${
        customization.briefLength
      }-word candidate brief, ${customization.briefTone} tone.

CRITICAL ANONYMISATION RULES:
1. NEVER mention the company name
2. NEVER mention the industry sector (fintech, healthcare, retail, etc.)
3. NEVER mention what market they serve or their customers
4. Use generic terms: "the organisation", "the business", "the company"
5. Focus on: role responsibilities, tech stack, team structure, working environment, benefits
6. Remove any sector-specific references

Job Description: ${formData.fileContent.substring(0, 2000)}
Company Info: ${formData.companyInfo?.substring(0, 1000) || "None"}`;

      const br = await apiCall(briefPrompt, 4000);
      setGeneratedContent((prev) => ({ ...prev, candidateBrief: br }));

      const emailPrompt = `Create 8 concise bullet points, ${
        customization.emailTone
      } tone, ${
        customization.emailLength
      } words total. Each bullet sells the role and opportunity.

CRITICAL ANONYMISATION RULES:
1. NEVER mention company name
2. NEVER mention industry sector or what market they serve
3. Focus on: tech, culture, growth, impact - NOT business domain
4. Use generic language only

Job Description: ${formData.fileContent.substring(0, 2000)}`;

      const em = await apiCall(emailPrompt, 1000);
      setGeneratedContent((prev) => ({ ...prev, emailBullets: em }));

      const toneDescriptions = {
        professional: "Professional and polished",
        dynamic: "Energetic and enthusiastic",
        conversational: "Warm and approachable",
        confident: "Assertive and compelling",
        friendly: "Casual and personable",
      };

      const elevatorPrompt = `Create an elevator pitch script for a phone conversation with a potential candidate. This should "sell" the role and company opportunity in a compelling, conversational way.

CRITICAL ANONYMISATION RULES:
1. NEVER mention company name
2. NEVER mention industry sector or what market they serve
3. Focus on: opportunity, tech stack, culture, growth, impact - NOT business domain
4. Use generic language only

STRUCTURE:
- Opening hook - grab attention, set context
- Key selling points - why this role is special, what they'll work on, tech stack highlights, team culture
- Closing - next steps, generate interest

STYLE:
- Natural, conversational tone (like you're actually speaking)
- ${toneDescriptions[customization.elevatorTone]} tone
- Enthusiastic but authentic
- Focus on what makes this opportunity unique
- Include pauses and natural speech patterns

LENGTH: Target ${
        customization.elevatorLength
      } words (approximately ${Math.round(
        customization.elevatorLength / 2.5
      )} seconds when spoken naturally)

Job Description: ${formData.fileContent.substring(0, 2000)}
Company Info: ${formData.companyInfo?.substring(0, 500) || "None"}

OUTPUT: A natural phone script that sounds conversational, not written. Target ${
        customization.elevatorLength
      } words.`;

      const ep = await apiCall(elevatorPrompt, 1500);
      setGeneratedContent((prev) => ({ ...prev, elevatorPitch: ep }));
    } catch (e) {
      setErrors((prev) => ({ ...prev, generation: "Failed" }));
    } finally {
      setProcessing((prev) => ({ ...prev, contentGeneration: false }));
    }
  };

  const generateEVP = async () => {
    if (!formData.fileContent) {
      setErrors((prev) => ({ ...prev, evp: "Add job description first" }));
      return;
    }
    setProcessing((prev) => ({ ...prev, evpGeneration: true }));
    setErrors((prev) => ({ ...prev, evp: "" }));

    try {
      const evpPrompt = `You are an expert Employer Value Proposition (EVP) consultant for technology recruitment. Create a comprehensive EVP document that highlights the employer's strengths across 8 key areas.

INPUT DATA:
Company URL: ${formData.companyUrl || "Not provided"}
Company Info: ${formData.companyInfo || "Not provided"}
Job Description: ${formData.fileContent.substring(0, 2500)}
Additional Notes: ${formData.additionalNotes || "None"}

CREATE AN EMPLOYER VALUE PROPOSITION COVERING THESE 8 AREAS:

1. **Career Progression Opportunities**
   - Analyze growth paths, promotion opportunities, advancement potential
   - Highlight leadership opportunities, project ownership, career trajectories
   - Use POSITIVE language - what opportunities exist, not what's missing

2. **Technology & Innovation**
   - Current tech stack being used
   - New technologies the company is adopting/exploring
   - Innovation culture, modernization efforts, technical evolution
   - Highlight cutting-edge tools, modern practices

3. **Training & Development**
   - Company-sponsored training programs
   - Conference attendance, certifications, course budgets
   - Mentorship, coaching, learning opportunities
   - Professional development support

4. **Company & Team Culture**
   - Team dynamics, collaboration style
   - Work environment, values, culture highlights
   - Team structure, social aspects, community feel
   - Use POSITIVE framing - what makes the culture great

5. **Salary & Benefits Package**
   - Compensation structure, salary ranges if mentioned
   - Benefits: pension, healthcare, bonuses, equity
   - Perks: gym, equipment, allowances
   - Financial and lifestyle benefits

6. **Domain & Business Impact**
   - Industry sector and market position
   - Product impact, user base, business growth
   - What the company builds, who benefits
   - Mission and purpose

7. **Flexibility & Work Arrangements**
   - Remote/hybrid/office options
   - Flexible hours, work-life balance
   - Location flexibility
   - Time off policies

8. **Management & Leadership Style**
   - Leadership approach, management philosophy
   - Communication style, transparency
   - Decision-making processes
   - Team autonomy and empowerment

CRITICAL STYLE REQUIREMENTS:
- Use ONLY POSITIVE LANGUAGE throughout
- Focus on what IS offered, not what's missing
- If information is limited, write about typical industry offerings for that type of company
- Make reasonable inferences from context
- Be specific where possible, aspirational where needed
- Write in compelling, engaging language
- Use bullet points and clear structure
- Each section should be 3-5 substantive points
- Total length: 600-800 words

TONE: Professional, enthusiastic, positive, compelling - this is a selling document

OUTPUT: Structured EVP document with 8 clearly labeled sections, using markdown headers (##) for each area, bullet points for details, ONLY positive framing.`;

      const evp = await apiCall(evpPrompt, 4000);
      setGeneratedContent((prev) => ({ ...prev, evp }));
    } catch (e) {
      setErrors((prev) => ({ ...prev, evp: "Failed to generate EVP" }));
    } finally {
      setProcessing((prev) => ({ ...prev, evpGeneration: false }));
    }
  };

  const generateCompetencies = async () => {
    const language =
      validationData.selectedLanguage === "other"
        ? validationData.customLanguage
        : validationData.selectedLanguage;
    if (!language || !validationData.yearsExperience) return;
    setProcessing((prev) => ({ ...prev, competencyGeneration: true }));
    try {
      const text = await apiCall(
        "List 5 competencies for " +
          language +
          " dev with " +
          validationData.yearsExperience +
          " years",
        1000
      );
      const list = text
        .split("\n")
        .map((l) => l.replace(/^\d+\.\s*/, "").trim())
        .filter((l) => l.length > 10);
      setValidationData((prev) => ({ ...prev, competencies: list }));

      const questionsText = await apiCall(
        "For each competency create 2 simple recruiter validation questions (not technical tests). Format as: COMPETENCY\nQ1: question\nQ2: question\n\nCompetencies:\n" +
          list.join("\n"),
        2000
      );
      setValidationData((prev) => ({
        ...prev,
        validationQuestions: questionsText,
      }));
    } catch (e) {
      setErrors((prev) => ({ ...prev, validation: "Failed" }));
    } finally {
      setProcessing((prev) => ({ ...prev, competencyGeneration: false }));
    }
  };

  const generateInterviewQuestions = async () => {
    if (!formData.fileContent) {
      setErrors((prev) => ({
        ...prev,
        interviewQuestions:
          "Please add job description first in Content Generation section",
      }));
      return;
    }

    setProcessing((prev) => ({ ...prev, interviewQuestionsGeneration: true }));
    setErrors((prev) => ({ ...prev, interviewQuestions: "" }));

    try {
      const jobDesc = formData.fileContent.substring(0, 2500);
      const contentContext = generatedContent.linkedinAdvert
        ? `\n\nGenerated Content Context:\n${generatedContent.linkedinAdvert.substring(
            0,
            500
          )}`
        : "";

      const prompt = `You are an expert IT recruiter. Analyze this job description and identify the top 3 essential technical skills for this role. Then create 2 non-technical validation questions for EACH skill that a recruiter (without technical expertise) can ask to validate a candidate's expertise.

JOB DESCRIPTION:
${jobDesc}
${contentContext}

OUTPUT FORMAT (plain text):
SKILL 1: [Skill Name]
Q1: [Question that helps validate this skill through conversation - NOT a coding test]
Q2: [Follow-up question to dig deeper into their experience]

SKILL 2: [Skill Name]
Q1: [Question that helps validate this skill through conversation]
Q2: [Follow-up question to dig deeper into their experience]

SKILL 3: [Skill Name]
Q1: [Question that helps validate this skill through conversation]
Q2: [Follow-up question to dig deeper into their experience]

REQUIREMENTS:
- Questions must be conversational, not technical tests
- Questions should reveal experience level through examples and context
- Focus on "Tell me about a time when..." or "How have you used..." style questions
- Questions should be easy for non-technical recruiters to ask and understand responses
- Each question should be specific enough to validate real expertise vs theoretical knowledge

Generate the 3 most critical technical skills and 2 validation questions each.`;

      const response = await apiCall(prompt, 2000);

      // Extract the top 3 skills from the response
      const skillMatches = response.match(/SKILL \d+: ([^\n]+)/g);
      const topSkills = skillMatches
        ? skillMatches.map((match) => match.replace(/SKILL \d+: /, "").trim())
        : [];

      setValidationData((prev) => ({
        ...prev,
        interviewQuestions: response,
        topSkills: topSkills,
      }));
    } catch (e) {
      console.error("Interview questions generation error:", e);
      setErrors((prev) => ({
        ...prev,
        interviewQuestions: "Failed to generate interview questions",
      }));
    } finally {
      setProcessing((prev) => ({
        ...prev,
        interviewQuestionsGeneration: false,
      }));
    }
  };

  const analyzeMotivations = async () => {
    if (!interviewData.selectedCandidate) {
      setErrors((prev) => ({
        ...prev,
        motivation: "Please select a candidate first",
      }));
      return;
    }

    const candidate = currentProject.cvAnalyses.find(
      (cv) =>
        (cv.candidateName || cv.fileName) === interviewData.selectedCandidate
    );
    if (!candidate) {
      setErrors((prev) => ({ ...prev, motivation: "Candidate not found" }));
      return;
    }

    const candidateName = candidate.candidateName || candidate.fileName;
    const candidateTranscript =
      currentProject.candidateTranscripts?.[candidateName] || "";

    if (!candidateTranscript) {
      setErrors((prev) => ({
        ...prev,
        motivation:
          "No interview transcript found for this candidate. Please add transcript in Candidate Interview section.",
      }));
      return;
    }

    setProcessing((prev) => ({ ...prev, motivationAnalysis: true }));
    setErrors((prev) => ({ ...prev, motivation: "" }));

    try {
      const motivationPrompt = `Analyze this interview transcript and extract the candidate's motivations, what they're looking for in their next role, and their priorities. Format as 4-6 bullet points.

INTERVIEW TRANSCRIPT:
${candidateTranscript.substring(0, 3000)}

Extract:
- Career goals and aspirations
- What they value in a role (e.g., learning, leadership, work-life balance)
- Technical interests and areas they want to work with
- Cultural preferences and team dynamics they seek
- Any concerns or requirements they mentioned

Format as bullet points starting with "-", be specific and actionable.`;

      const candidateMotivations = await apiCall(motivationPrompt, 1000);

      // Update the interview data with the analyzed motivations
      setInterviewData((prev) => ({
        ...prev,
        hiringPriorities: candidateMotivations,
      }));
    } catch (e) {
      setErrors((prev) => ({
        ...prev,
        motivation: "Failed to analyze motivations. Please try again.",
      }));
    } finally {
      setProcessing((prev) => ({ ...prev, motivationAnalysis: false }));
    }
  };

  const generateInterviewBrief = async () => {
    if (!interviewData.selectedCandidate || !interviewData.duration) {
      setErrors((prev) => ({
        ...prev,
        interview: "Please select a candidate and enter interview duration",
      }));
      return;
    }

    setProcessing((prev) => ({ ...prev, interviewGeneration: true }));
    setErrors((prev) => ({ ...prev, interview: "" }));

    try {
      const candidate = currentProject.cvAnalyses.find(
        (cv) => cv.fileName === interviewData.selectedCandidate
      );
      if (!candidate) {
        throw new Error("Candidate not found");
      }

      const candidateName = candidate.candidateName || candidate.fileName;
      const candidateTranscript =
        currentProject.candidateTranscripts?.[candidateName] || "";

      // Use existing motivations or warn if not analyzed yet
      const candidateMotivations = interviewData.hiringPriorities || "";
      if (!candidateMotivations && candidateTranscript) {
        setErrors((prev) => ({
          ...prev,
          interview:
            'Tip: Click "Analyze Candidate Motivations" first for better results',
        }));
      }

      const jobDesc =
        formData.fileContent?.substring(0, 2000) ||
        "No job description provided";
      const candidateSummary = candidate.analysis.recruiterSummary || "";
      const techSkills = candidate.analysis.primaryTechSkills?.join(", ") || "";
      const strengths = candidate.analysis.keyStrengths?.join("; ") || "";
      const additionalValue =
        candidate.analysis.additionalValue?.join("; ") || "";
      const skillAnalysis = candidate.analysis.skillAnalysis || {};

      // Include full interview transcript if available
      const interviewTranscriptContext = candidateTranscript
        ? `\n\nINTERVIEW TRANSCRIPT:\nHere is the candidate's complete interview transcript:\n${candidateTranscript.substring(
            0,
            3000
          )}\n\nUse this to inform discussion points and understand the candidate's communication style, motivations, and technical depth.`
        : "";

      const topSkillsContext =
        validationData.topSkills && validationData.topSkills.length > 0
          ? `\n\nTOP 3 ESSENTIAL SKILLS IDENTIFIED:\n${validationData.topSkills.join(
              ", "
            )}`
          : "";

      const prompt = `Create interview preparation materials for this candidate. Generate EXACTLY 3 outputs.

CANDIDATE:
Name: ${candidateName}
Tech Skills: ${techSkills}
Summary: ${candidateSummary}
Strengths: ${strengths}
Additional Value: ${additionalValue}
Skill Analysis: ${JSON.stringify(skillAnalysis)}
${topSkillsContext}
${interviewTranscriptContext}

CANDIDATE MOTIVATIONS (from interview):
${candidateMotivations || "Not yet analyzed - focus on general fit assessment"}

JOB DESCRIPTION:
${jobDesc}

INTERVIEW DETAILS:
Duration: ${interviewData.duration}
Format: ${interviewData.format || "Not specified"}
Focus Areas: ${interviewData.focus || "General assessment"}
Agenda: ${interviewData.agenda || "Standard interview flow"}

Generate EXACTLY this structure:

OUTPUT 1 - CLIENT PREPARATION BRIEF (800-1000 words):
A comprehensive, strategically positive brief for the hiring manager/client that emphasizes candidate potential and fit while being realistic about development areas.

CRITICAL TONE REQUIREMENTS:
- Lead with strengths and potential
- Frame gaps as "development opportunities" or "growth areas" not weaknesses
- Use positive language: "brings fresh perspective", "learning trajectory", "foundation for growth"
- Example: Instead of "lacks Kubernetes experience" → "Strong Docker foundation provides clear pathway to Kubernetes mastery"
- Be optimistic about fit while remaining honest
- Emphasize what they CAN do, then briefly note what they're LEARNING
- ALWAYS use the candidate's name (${candidateName}) instead of "they/their/them" when referring to the candidate

Structure with these EXACT sections:

**1. CANDIDATE OVERVIEW**
Brief intro paragraph with overall impression and fit score context (use ${candidateName}'s name)

**2. CANDIDATE MOTIVATIONS & ROLE ALIGNMENT** (EXPANDED - 200-250 words)
Deep dive into what drives this candidate (use ${candidateName}'s name throughout):
- What ${candidateName} is seeking in the next role (specific motivations from transcript)
- Career aspirations and growth trajectory ${candidateName} is pursuing
- Values and work environment preferences
- Technical interests and areas ${candidateName} wants to develop
- How THIS SPECIFIC ROLE aligns with each of ${candidateName}'s motivations (be detailed and positive)
- Cultural fit indicators based on ${candidateName}'s communication style
- Long-term potential with your organization
- Why this is a strong mutual fit (weight heavily positive)

**3. TECHNICAL ANALYSIS** (EXPANDED - 250-300 words)
Comprehensive technical assessment combining CV and interview performance (use ${candidateName}'s name):

A) Interview Performance Analysis:
- Review ${candidateName}'s answers to technical validation questions from the interview transcript
- Assess depth of knowledge ${candidateName} demonstrated in responses
- ${candidateName}'s communication style and ability to explain technical concepts
- Problem-solving approach ${candidateName} showed in answers

B) Skills Match Against Job Spec:
- Core technical requirements and how ${candidateName} meets them (lead with matches)
- Strong foundation skills that transfer well
- Technologies ${candidateName} has used extensively
- Development areas positioned as growth opportunities with clear pathways
- Overall technical readiness (positive framing)

C) Technical Potential:
- Learning agility ${candidateName} has demonstrated in background
- Track record of picking up new technologies
- Foundation skills that enable quick ramp-up

**4. KEY STRENGTHS** (150-200 words)
What makes ${candidateName} compelling - expanded detail on standout qualities aligned with role needs

**5. DEVELOPMENT AREAS** (100-150 words)
Gaps reframed as growth opportunities (use ${candidateName}'s name):
- Frame each gap with: "While ${candidateName} hasn't worked with [gap], ${candidateName}'s [related strength] provides foundation for rapid development"
- Include suggested onboarding/training approaches
- Emphasize learning trajectory over current state

**6. RECOMMENDED DISCUSSION POINTS** (200-250 words)
Structured in THREE parts:

A) Questions to Ask the Candidate:
- Probing questions about ${candidateName}'s experience and motivations
- Technical depth verification questions
- Culture fit assessment questions

B) Topics to Explore in the Interview:
- Specific projects or experiences to discuss in detail
- Problem-solving scenarios relevant to the role
- Team dynamics and collaboration style

C) Selling Points to Emphasize About the Role:
- Aspects of the opportunity that align with ${candidateName}'s motivations
- Growth opportunities that match ${candidateName}'s aspirations
- Team/culture elements that fit ${candidateName}'s preferences

**7. INTERVIEW STRUCTURE & NEXT STEPS**
- Recommended interview flow and timing
- Key focus areas for each interview segment
- Follow-up items and timeline

Professional, strategic, optimistic tone throughout. Help the client see ${candidateName}'s potential and strong fit while being realistic about development needs.

OUTPUT 2 - CANDIDATE PREPARATION BRIEF (400-550 words):
A comprehensive, supportive brief to send the candidate.

STRUCTURE - Start with interview prep at the TOP:

**INTERVIEW PREPARATION & AGENDA:**
- Interview structure and what to expect
- Duration: ${interviewData.duration}
- Format: ${interviewData.format || "Not specified"}
- Who you'll meet and what each interviewer focuses on
- Key topics that will be discussed
- Company culture and values
- What to bring and how to prepare examples
- Next steps and timeline

**YOUR STRENGTHS FOR THIS ROLE:**
- List 4-5 specific strengths aligned with the job spec
- Explain how each strength is relevant to what they're looking for
- Give examples of how to demonstrate these in the interview

**AREAS TO ADDRESS:**
- Identify 2-3 potential areas where you might not have direct experience (based on job spec)
- For EACH area, provide:
  * A positive reframe (e.g., "While you haven't used Kubernetes, your Docker experience provides a strong foundation")
  * Specific preparation tasks to address it (e.g., "Review Kubernetes basics, be ready to discuss how you'd approach learning it")
  * How to position it positively in the interview (e.g., "Highlight your quick learning track record with similar technologies")

**HOW THIS ROLE ALIGNS WITH YOUR GOALS:**
- Based on your stated motivations, explain how this role can meet your needs
- Highlight aspects of the role that match what you're looking for
- Address any potential mismatches proactively

Warm, encouraging, practical tone that builds confidence while being realistic about preparation needed.

OUTPUT 3 - CANDIDATE PRE-INTERVIEW CHECKLIST (10 items):
A comprehensive checklist of tasks for THE CANDIDATE to complete before the interview. Each item should be an actionable task. Format as:
- [ ] Task description

Include items like:
- [ ] Research the company's recent projects, tech stack, and engineering blog posts
- [ ] Prepare 3-4 STAR method examples showcasing relevant technical achievements
- [ ] Review [specific technology from gaps] basics and prepare to discuss learning approach
- [ ] Prepare examples demonstrating [specific strengths aligned with role]
- [ ] Review job description and prepare questions about aspects that align with your motivations
- [ ] Test video call software and ensure stable internet connection
- [ ] Have code samples or portfolio ready to discuss specific to [job requirements]
- [ ] Prepare questions about team structure, development practices, and tech roadmap
- [ ] Plan arrival time allowing 10-15 minutes buffer for setup
- [ ] Review your experience with [key job requirements] and prepare detailed examples

Return as plain text with clear separators:
===PROFESSIONAL BRIEF===
[content]
===COACHING BRIEF===
[content]
===CHECKLIST===
[content]`;

      const response = await apiCall(prompt, 5000);

      // Parse the response
      const professionalMatch = response.match(
        /===PROFESSIONAL BRIEF===\s*([\s\S]*?)\s*===/
      );
      const coachingMatch = response.match(
        /===COACHING BRIEF===\s*([\s\S]*?)\s*===/
      );
      const checklistMatch = response.match(/===CHECKLIST===\s*([\s\S]*?)$/);

      setInterviewData((prev) => ({
        ...prev,
        professionalBrief: professionalMatch
          ? professionalMatch[1].trim()
          : response.substring(0, 500),
        coachingBrief: coachingMatch ? coachingMatch[1].trim() : "",
        checklist: checklistMatch ? checklistMatch[1].trim() : "",
      }));
    } catch (e) {
      setErrors((prev) => ({
        ...prev,
        interview: "Failed to generate interview brief",
      }));
    } finally {
      setProcessing((prev) => ({ ...prev, interviewGeneration: false }));
    }
  };

  const generateTechnicalOverview = async (candidateName) => {
    console.log("=== Technical Overview Generation Started ===");
    console.log("Candidate Name:", candidateName);
    console.log("Current Project:", currentProject?.clientName);
    console.log("Has CV Analyses:", !!currentProject?.cvAnalyses?.length);
    console.log("Has Transcripts:", !!currentProject?.candidateTranscripts);

    if (!candidateName) {
      setErrors((prev) => ({
        ...prev,
        technicalOverview: "Please select a candidate",
      }));
      return;
    }

    if (!currentProject) {
      setErrors((prev) => ({
        ...prev,
        technicalOverview: "No project loaded",
      }));
      console.error("No current project");
      return;
    }

    const transcript = currentProject.candidateTranscripts?.[candidateName];
    console.log("Transcript found:", !!transcript);
    console.log("Transcript length:", transcript?.length);

    if (!transcript) {
      setErrors((prev) => ({
        ...prev,
        technicalOverview: `No transcript found for ${candidateName}`,
      }));
      console.error("No transcript for candidate:", candidateName);
      return;
    }

    const candidate = currentProject.cvAnalyses.find(
      (cv) => (cv.candidateName || cv.fileName) === candidateName
    );

    console.log("Candidate found:", !!candidate);
    console.log(
      "Candidate data:",
      candidate
        ? {
            name: candidate.candidateName,
            score: candidate.analysis?.overallScore,
          }
        : null
    );

    if (!candidate) {
      setErrors((prev) => ({
        ...prev,
        technicalOverview: "Candidate data not found",
      }));
      console.error("No candidate found in cvAnalyses for:", candidateName);
      return;
    }

    setProcessing((prev) => ({ ...prev, technicalOverviewGeneration: true }));
    setErrors((prev) => ({ ...prev, technicalOverview: null }));

    try {
      const jobDesc =
        currentProject.fileContent || "No job description available";
      const analysis = candidate.analysis || {};

      console.log("Preparing API call...");
      console.log("Job desc length:", jobDesc.length);
      console.log("Analysis data:", {
        score: analysis.overallScore,
        skillsMatch: analysis.technicalSkillsMatch,
      });

      const prompt = `You are an expert technical recruiter analyzing a candidate's interview performance. Based on the interview transcript and job requirements, create a detailed technical skills breakdown.

JOB REQUIREMENTS:
${jobDesc.substring(0, 2500)}

CANDIDATE: ${candidateName}
CV ANALYSIS SCORE: ${analysis.overallScore || "Not scored"}/100
TECHNICAL SKILLS MATCH: ${analysis.technicalSkillsMatch || "N/A"}%
KEY STRENGTHS: ${(analysis.keyStrengths || []).join(", ") || "Not specified"}
PRIMARY TECH SKILLS: ${
        (analysis.primaryTechSkills || []).join(", ") || "Not specified"
      }

INTERVIEW TRANSCRIPT:
${transcript}

Create a comprehensive technical interview overview with these sections:

**TECHNICAL SKILLS ASSESSMENT**

For each major technical area covered in the interview, provide:
• Skill/Technology name
• Proficiency level demonstrated (Junior/Intermediate/Advanced/Expert)
• Evidence from their answers (specific quotes or paraphrased responses)
• Depth of understanding shown
• Practical application examples they provided

**PROBLEM-SOLVING APPROACH**
• How they approach technical challenges
• Analytical thinking demonstrated
• Design decisions and trade-offs discussed
• Communication clarity on technical topics

**EXPERIENCE VALIDATION**
• Claims from CV that were validated in interview
• Real-world project examples they described
• Technologies they've used in production
• Team collaboration and technical leadership indicators

**TECHNICAL GAPS & LEARNING AGILITY**
• Areas where knowledge was limited
• How they responded to questions outside their expertise
• Learning approach and adaptability indicators
• Transferable skills that bridge gaps

**OVERALL TECHNICAL READINESS**
• Summary of technical fit for the role
• Key strengths to leverage
• Priority development areas
• Recommended technical onboarding focus

Format as bullet points for easy scanning. Be specific with evidence from the transcript. Use ${candidateName}'s name throughout.`;

      console.log("Calling API...");
      const overview = await apiCall(prompt, 4000);
      console.log("API call successful, overview length:", overview.length);

      setProjects((prev) =>
        prev.map((p) => {
          if (p.id === currentProjectId) {
            console.log("Updating project with technical overview");
            return {
              ...p,
              technicalOverviews: {
                ...(p.technicalOverviews || {}),
                [candidateName]: overview,
              },
              lastUpdated: new Date().toISOString(),
            };
          }
          return p;
        })
      );

      console.log("Technical overview generation completed successfully");
    } catch (e) {
      console.error("=== Technical overview generation error ===");
      console.error("Error type:", e.constructor.name);
      console.error("Error message:", e.message);
      console.error("Error stack:", e.stack);
      setErrors((prev) => ({
        ...prev,
        technicalOverview:
          "Failed to generate technical overview: " +
          (e.message || "Unknown error"),
      }));
    } finally {
      setProcessing((prev) => ({
        ...prev,
        technicalOverviewGeneration: false,
      }));
      console.log("=== Technical Overview Generation Ended ===");
    }
  };

  //   } catch (e) {
  //     console.error('Technical overview generation error:', e);
  //     setErrors(prev => ({ ...prev, technicalOverview: 'Failed to generate technical overview' }));
  //   } finally {
  //     setProcessing(prev => ({ ...prev, technicalOverviewGeneration: false }));
  //   }
  // };
  // ============================================
  // CANDIDATE TO MARKET FUNCTIONS
  // ============================================

  const createCtmProject = () => {
    if (!newCtmProjectName.trim()) return;
    const newProj = {
      id: Date.now().toString(),
      candidateName: newCtmProjectName.trim(),
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      campaigns: [],
    };
    setCtmProjects((prev) => [...prev, newProj]);
    setCurrentCtmProjectId(newProj.id);
    setNewCtmProjectName("");
    setShowCtmProjectList(false);
    setCtmStage(1);
  };

  const deleteCtmProject = (id) => {
    if (
      !window.confirm(
        "Delete this candidate project? All campaigns will be lost."
      )
    )
      return;
    setCtmProjects((prev) => prev.filter((p) => p.id !== id));
    if (currentCtmProjectId === id) {
      setCurrentCtmProjectId(null);
      setShowCtmProjectList(true);
    }
  };

  const deleteCtmCampaign = (campaignId) => {
    if (!window.confirm("Delete this campaign? This cannot be undone.")) return;
    setCtmProjects((prev) =>
      prev.map((p) => {
        if (p.id === currentCtmProjectId) {
          return {
            ...p,
            campaigns: p.campaigns.filter((c) => c.id !== campaignId),
            lastUpdated: new Date().toISOString(),
          };
        }
        return p;
      })
    );
  };

  const saveCampaignToProject = (campaignData) => {
    if (!currentCtmProjectId) return;

    const campaign = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      ...campaignData,
    };

    setCtmProjects((prev) =>
      prev.map((p) => {
        if (p.id === currentCtmProjectId) {
          return {
            ...p,
            campaigns: [...(p.campaigns || []), campaign],
            lastUpdated: new Date().toISOString(),
          };
        }
        return p;
      })
    );
  };

  const ctmHandleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setCtmCvFile(file);
      setCtmSummaries(null);
    }
  };

  const ctmGenerateSummaries = async () => {
    if (!ctmCvFile || !ctmIndustry) {
      alert("Please upload a CV and specify the industry");
      return;
    }

    setCtmLoading(true);

    const lengthMap = {
      short: "8-10 words per bullet",
      medium: "12-15 words per bullet",
      long: "15-20 words per bullet",
    };

    const toneMap = {
      professional: "Professional and formal tone",
      dynamic: "Dynamic and energetic tone with action verbs",
      technical: "Technical and precise tone for engineering audiences",
      executive: "Executive-level strategic tone",
      confident: "Confident and assertive tone emphasizing achievements",
    };

    try {
      const fileContent = await ctmCvFile.text();

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          messages: [
            {
              role: "user",
              content: `You are a senior IT recruiter. Analyze this CV and create TWO 8-bullet marketing summaries for hiring managers. Each bullet must be ONE punchy sentence only.

CV Content:
${fileContent}

Target Industry/Domain: ${ctmIndustry}

STYLE REQUIREMENTS:
- Tone: ${toneMap[ctmTone]}
- Length: ${lengthMap[ctmLength]}

Generate EXACTLY this JSON structure with no additional text:
{
  "technical": [
    "bullet 1 focusing on tech stack/skills",
    "bullet 2...",
    ...8 bullets total
  ],
  "industry": [
    "bullet 1 focusing on ${ctmIndustry} domain experience",
    "bullet 2...",
    ...8 bullets total
  ]
}

Requirements:
- Highlight major achievements and quantifiable results
- Technical summary: emphasize languages, frameworks, tools
- Industry summary: emphasize domain expertise in ${ctmIndustry}
- Make it compelling for hiring managers
- One sentence per bullet maximum
- DO NOT mention specific company names in the industry summary - keep it generic and transferable

RESPOND ONLY WITH VALID JSON. DO NOT include any text before or after the JSON object.`,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();

      if (!data.content || !data.content[0] || !data.content[0].text) {
        throw new Error("Invalid API response structure");
      }

      let responseText = data.content[0].text.trim();
      responseText = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      const parsed = JSON.parse(responseText);

      if (!parsed.technical || !parsed.industry) {
        throw new Error("Response missing required fields");
      }

      if (!Array.isArray(parsed.technical) || !Array.isArray(parsed.industry)) {
        throw new Error("Response fields are not arrays");
      }

      setCtmSummaries(parsed);
      setCtmCopied({
        technical: false,
        industry: false,
        softwareList: false,
        industryList: false,
      });
    } catch (error) {
      console.error("Summary generation error:", error);
      alert(`Failed to generate summaries: ${error.message}`);
    } finally {
      setCtmLoading(false);
    }
  };

  const ctmCopyToClipboard = (type) => {
    if (!ctmSummaries || !ctmSummaries[type]) return;

    const text = ctmSummaries[type]
      .map((bullet, idx) => `${idx + 1}. ${bullet}`)
      .join("\n\n");
    navigator.clipboard.writeText(text);
    setCtmCopied({ ...ctmCopied, [type]: true });
    setTimeout(() => setCtmCopied({ ...ctmCopied, [type]: false }), 2000);
  };

  const ctmCopyCompanyList = (listType) => {
    if (!ctmAnalysis) return;

    const companies =
      listType === "software"
        ? ctmAnalysis.softwareCompanies
        : ctmAnalysis.industryCompanies;

    if (!companies || companies.length === 0) return;

    const companyNames = companies.map((c) => c.name).join("\n");
    navigator.clipboard.writeText(companyNames);

    const key = listType === "software" ? "softwareList" : "industryList";
    setCtmCopied({ ...ctmCopied, [key]: true });
    setTimeout(() => setCtmCopied({ ...ctmCopied, [key]: false }), 2000);
  };

  const ctmGenerateAnalysis = async () => {
    if (!ctmEmployerUrl) {
      alert("Please enter an Employer Website URL");
      return;
    }

    // Basic URL validation
    try {
      new URL(ctmEmployerUrl);
    } catch {
      alert("Please enter a valid URL (e.g., https://example.com)");
      return;
    }

    setCtmLoading(true);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 16000,
          messages: [
            {
              role: "user",
              content: `CRITICAL TASK: Generate TWO COMPLETE company lists for UK software recruitment targeting.

CONTEXT:
Employer URL: ${ctmEmployerUrl}
${
  ctmSector
    ? `User-specified sector: ${ctmSector}`
    : "Sector: Auto-detect from URL"
}

STEP 1: Detect the sector/industry from the URL
- Analyze the employer's business domain
- Return the detected sector clearly

STEP 2: Generate LIST 1 - Software/Tech Companies (CRITICAL: Must be 30-50 companies)
UK-headquartered software/technology companies that:
- Build software products OR provide tech services
- Employ software engineers
- Range from 50 to 5000+ employees
- Have active UK presence
- SORT BY: Hiring signals first, then growth indicators, then headcount (largest first)

STEP 3: Generate LIST 2 - Industry Companies (CRITICAL: Must be 20-40 companies)
UK companies OPERATING IN the detected sector that:
- Are IN the same industry (e.g., if fintech detected, list financial services companies)
- Need software engineers for internal tech teams
- Range from 100 to 10000+ employees
- Have UK headquarters
- SORT BY: Growth & hiring signals, then headcount (largest first)

OUTPUT FORMAT (JSON):
{
  "detectedSector": "detected industry name",
  "softwareCompanies": [
    {
      "name": "Company Name",
      "website": "https://...",
      "hq": "City, UK",
      "headcount": "employees as string like '500-1000'",
      "growth": "High|Medium|Low",
      "growthNote": "brief reason",
      "recentHiring": true|false,
      "hiringSource": "source name if hiring",
      "hiringMonth": "month if known",
      "hiringUrl": "url if available",
      "linkedinUrl": "https://linkedin.com/company/..."
    }
  ],
  "industryCompanies": [same structure]
}

CRITICAL REQUIREMENTS:
1. MUST return 30-50 software companies
2. MUST return 20-40 industry companies
3. All companies MUST be real and verifiable
4. All companies MUST have UK HQ
5. Hiring signals MUST be current (last 3 months)
6. Growth assessment MUST be justified
7. LinkedIn URLs MUST be valid
8. NO placeholder or fictional companies

Return ONLY valid JSON, no markdown, no extra text.`,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();

      if (!data.content || !data.content[0] || !data.content[0].text) {
        throw new Error("Invalid API response structure");
      }

      let responseText = data.content[0].text.trim();
      responseText = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      const parsed = JSON.parse(responseText);

      if (!parsed.softwareCompanies || !parsed.industryCompanies) {
        throw new Error("Response missing required company lists");
      }

      if (
        !Array.isArray(parsed.softwareCompanies) ||
        !Array.isArray(parsed.industryCompanies)
      ) {
        throw new Error("Company lists are not arrays");
      }

      // Warn if lists are unexpectedly short
      if (
        parsed.softwareCompanies.length < 10 ||
        parsed.industryCompanies.length < 5
      ) {
        console.warn("Company lists shorter than expected");
      }

      setCtmAnalysis(parsed);

      // Save campaign to project
      if (currentCtmProjectId && ctmSummaries) {
        saveCampaignToProject({
          industry: ctmIndustry,
          summaries: ctmSummaries,
          employerUrl: ctmEmployerUrl,
          sector: ctmSector,
          analysis: parsed,
          tone: ctmTone,
          length: ctmLength,
        });
      }
    } catch (error) {
      console.error("Analysis generation error:", error);
      alert(`Failed to generate analysis: ${error.message}`);
    } finally {
      setCtmLoading(false);
    }
  };

  const deleteCandidate = (cvId) => {
    if (!currentProject) return;

    const cvToDelete = currentProject.cvAnalyses?.find((cv) => cv.id === cvId);
    if (!cvToDelete) return;

    if (
      !window.confirm(
        `Delete ${cvToDelete.fileName} from this project? This cannot be undone.`
      )
    ) {
      return;
    }

    // Remove from project's cvAnalyses
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === currentProjectId) {
          return {
            ...p,
            cvAnalyses: (p.cvAnalyses || []).filter((cv) => cv.id !== cvId),
            lastUpdated: new Date().toISOString(),
          };
        }
        return p;
      })
    );

    // Remove from cvFiles if present
    setCvFiles((prev) => prev.filter((f) => f.id !== cvId));
  };

  const analyzeCv = async (cvFileId) => {
    const cvFile = cvFiles.find((f) => f.id === cvFileId);
    if (!cvFile) return;

    setProcessing((prev) => ({ ...prev, cvAnalysis: true }));
    setErrors((prev) => ({ ...prev, cvAnalysis: "" }));

    try {
      const jobDesc =
        formData.fileContent?.substring(0, 2000) ||
        "No job description provided";
      const cvContent = cvFile.content.substring(0, 3000);

      // Include interview transcript if available
      const interviewContext = validationData.interviewTranscript
        ? `\n\nINTERVIEW VALIDATION DATA:\nThe candidate was asked technical validation questions and provided the following responses:\n${validationData.interviewTranscript.substring(
            0,
            2000
          )}\n\nConsider these interview responses when assessing technical capabilities and provide more nuanced scoring based on both CV and interview performance.`
        : "";

      const topSkillsContext =
        validationData.topSkills && validationData.topSkills.length > 0
          ? `\n\nTOP 3 ESSENTIAL SKILLS FOR THIS ROLE:\n${validationData.topSkills.join(
              ", "
            )}\n\nPay special attention to these critical skills in your analysis.`
          : "";

      const prompt = `Analyze this CV against the job requirements. Return ONLY valid JSON, no markdown, no backticks.

CV:
${cvContent}

JOB:
${jobDesc}
${topSkillsContext}
${interviewContext}

Return this exact JSON structure:
{
  "candidateName": "Extract the candidate's full name from the CV",
  "overallScore": 75,
  "jobTechSkills": ["Skill1", "Skill2", "Skill3", "Skill4", "Skill5", "Skill6"],
  "skillAnalysis": {
    "Skill1": "One clear sentence explaining how the candidate demonstrates this skill with specific evidence from their CV, OR if they don't have it, explain their transferable skills that could apply.",
    "Skill2": "One clear sentence explaining how the candidate demonstrates this skill with specific evidence from their CV, OR if they don't have it, explain their transferable skills that could apply.",
    "Skill3": "One clear sentence explaining how the candidate demonstrates this skill with specific evidence from their CV, OR if they don't have it, explain their transferable skills that could apply.",
    "Skill4": "One clear sentence explaining how the candidate demonstrates this skill with specific evidence from their CV, OR if they don't have it, explain their transferable skills that could apply.",
    "Skill5": "One clear sentence explaining how the candidate demonstrates this skill with specific evidence from their CV, OR if they don't have it, explain their transferable skills that could apply.",
    "Skill6": "One clear sentence explaining how the candidate demonstrates this skill with specific evidence from their CV, OR if they don't have it, explain their transferable skills that could apply."
  },
  "primaryTechSkills": ["React", "Node.js", "AWS", "PostgreSQL", "Docker"],
  "technicalSkillsMatch": 80,
  "technicalSkillsReason": "Brief explanation of technical skills match",
  "experienceMatch": 75,
  "experienceReason": "Brief explanation of experience match",
  "culturalFitIndicators": 70,
  "culturalFitReason": "Brief explanation of cultural fit",
  "keyStrengths": ["Strength 1", "Strength 2", "Strength 3", "Strength 4", "Strength 5"],
  "additionalValue": ["Value proposition 1", "Value proposition 2", "Value proposition 3"],
  "recruiterSummary": "A detailed, ENTIRELY POSITIVE 2-paragraph summary (150-200 words total) explaining why this candidate is valuable and what they bring to the role. First paragraph should cover their technical capabilities and experience - focus on what they CAN do. Second paragraph should highlight their achievements and strengths. NEVER mention gaps, weaknesses, or what's missing. Frame everything positively - if they lack a skill, mention their quick learning ability or transferable experience. This is a SELLING document.",
  "verdict": {
    "decision": "Good Fit",
    "description": "Brief positive reasoning",
    "color": "green"
  },
  "recommendation": {
    "action": "Phone Screen",
    "description": "Next steps recommendation"
  }
}

CRITICAL REQUIREMENTS - POSITIVE LANGUAGE ONLY:
- jobTechSkills: Extract the top 6 PRIMARY technical skills from the JOB DESCRIPTION (not the CV) - these are the skills the employer is looking for
- skillAnalysis: For EACH of the 6 jobTechSkills, write EXACTLY 1 clear sentence (15-25 words) explaining what the candidate brings. If they have the skill, cite evidence. If they don't, mention transferable skills or learning potential. NEVER use negative language like "lacks", "doesn't have", "missing", "gap". Instead use positive framing like "brings experience in similar technologies", "demonstrates strong foundation that transfers to", "quick learner with proven ability to master new tools"
- primaryTechSkills: Extract EXACTLY 5 PRIMARY technical skills from this CANDIDATE'S CV
- keyStrengths: List 5 distinct strengths - what makes this candidate valuable
- additionalValue: List 3 additional value propositions this candidate brings (e.g., "Cross-functional collaboration experience", "Track record of mentoring juniors", "Experience scaling systems")
- recruiterSummary: Must be 150-200 words, split into 2 paragraphs, ENTIRELY POSITIVE. Focus on what they CAN do, what they HAVE achieved, why they're VALUABLE. Never mention what they're missing or lacking. This is a document to SELL the candidate to a hiring manager.
- REMOVED "gaps" field - we only focus on positives
- verdict.description: Must be positive and focus on fit, not deficiencies
- Pick only PRIMARY technical skills, not soft skills or methodologies

TONE: Positive, strengths-focused, value-oriented. You're writing to help a recruiter SELL this candidate, not critique them.`;

      const text = await apiCall(prompt, 2000);

      // Clean the response
      let cleanText = text.trim();

      // Remove markdown code blocks if present
      cleanText = cleanText.replace(/```json\s*/g, "").replace(/```\s*/g, "");

      // Find JSON object
      const jsonStart = cleanText.indexOf("{");
      const jsonEnd = cleanText.lastIndexOf("}");

      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error("No valid JSON found in response");
      }

      cleanText = cleanText.substring(jsonStart, jsonEnd + 1);

      const analysis = JSON.parse(cleanText);

      // Validate required fields
      if (
        !analysis.overallScore ||
        !analysis.verdict ||
        !analysis.recommendation ||
        !analysis.keyStrengths
      ) {
        throw new Error("Missing required fields in analysis");
      }

      // Ensure arrays exist - gaps removed, additionalValue added
      analysis.keyStrengths = analysis.keyStrengths || [];
      analysis.additionalValue = analysis.additionalValue || [];
      analysis.gaps = []; // Remove gaps entirely

      setCvFiles((prev) =>
        prev.map((f) => (f.id === cvFileId ? { ...f, analysis } : f))
      );

      if (currentProjectId) {
        setProjects((prev) =>
          prev.map((p) => {
            if (p.id === currentProjectId) {
              const existing = p.cvAnalyses || [];
              // Check for duplicate by candidate name or filename
              const candidateName = analysis.candidateName || cvFile.file.name;
              const isDuplicate = existing.some(
                (e) =>
                  e.candidateName === candidateName ||
                  e.fileName === cvFile.file.name
              );

              if (isDuplicate) {
                console.log(
                  `Duplicate candidate detected: ${candidateName}, skipping...`
                );
                return p; // Don't add duplicate
              }

              return {
                ...p,
                cvAnalyses: [
                  ...existing,
                  {
                    id: Date.now().toString(),
                    candidateName: analysis.candidateName || cvFile.file.name,
                    fileName: cvFile.file.name,
                    analyzedAt: new Date().toISOString(),
                    cvContent: cvFile.content.substring(0, 5000),
                    analysis,
                  },
                ],
                lastUpdated: new Date().toISOString(),
              };
            }
            return p;
          })
        );
      }
    } catch (error) {
      console.error("CV analysis error:", error);
      setErrors((prev) => ({
        ...prev,
        cvAnalysis:
          "Analysis failed for " +
          cvFile.file.name +
          ". Please try again or check CV content is readable.",
      }));
    } finally {
      setProcessing((prev) => ({ ...prev, cvAnalysis: false }));
    }
  };

  const handleCvFiles = async (files) => {
    for (const file of Array.from(files)) {
      if (file.size > FILE_SIZE_LIMIT) {
        setErrors((prev) => ({
          ...prev,
          cvUpload: file.name + ": Too large (max 10MB)",
        }));
        continue;
      }

      setProcessing((prev) => ({ ...prev, fileUpload: true }));

      try {
        const ext = file.name.split(".").pop().toLowerCase();
        let content = "";

        if (ext === "pdf" && pdfJsReady) {
          const buf = await file.arrayBuffer();
          const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const text = await page.getTextContent();
            content += text.items.map((item) => item.str).join(" ") + "\n";
          }
        } else if (ext === "docx" || ext === "doc") {
          // For Word documents, read as text and try multiple extraction methods
          const arrayBuffer = await file.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);

          // Convert to string - more aggressive extraction
          let rawText = "";
          for (let i = 0; i < uint8Array.length; i++) {
            const char = uint8Array[i];
            // Only include printable ASCII and common characters
            if ((char >= 32 && char <= 126) || char === 10 || char === 13) {
              rawText += String.fromCharCode(char);
            } else if (char > 127) {
              // Try to handle UTF-8 characters
              rawText += String.fromCharCode(char);
            }
          }

          // Clean up the extracted text
          content = rawText
            .replace(/\0/g, "") // Remove null bytes
            .replace(/[^\x20-\x7E\n\r\u00A0-\uFFFF]/g, " ") // Keep readable chars
            .replace(/\s+/g, " ") // Normalize whitespace
            .replace(/(.)\1{4,}/g, "$1$1$1") // Remove long repetitions
            .trim();

          // Extract likely content sections (look for common CV patterns)
          const sections = content.split(/[•\-\*\n]{2,}/);
          const meaningfulContent = sections
            .filter((s) => s.length > 20 && /[a-zA-Z]{3,}/.test(s))
            .join("\n");

          if (meaningfulContent.length > 100) {
            content = meaningfulContent;
          }

          if (content.length < 100) {
            throw new Error(
              "Could not extract enough text from Word file. Try: 1) Save as PDF, or 2) Copy text and paste into Content Generation job description box"
            );
          }
        } else if (ext === "txt") {
          content = await file.text();
        } else {
          throw new Error(
            "Unsupported format. Use PDF, Word (DOC/DOCX), or TXT"
          );
        }

        if (content && content.length > 100) {
          setCvFiles((prev) => [
            ...prev,
            {
              id:
                Date.now().toString() +
                "_" +
                Math.random().toString(36).substr(2, 9),
              file,
              content,
              analysis: null,
            },
          ]);
          setErrors((prev) => ({ ...prev, cvUpload: "" }));
        } else {
          throw new Error(
            "File appears empty or contains too little readable text"
          );
        }
      } catch (e) {
        setErrors((prev) => ({
          ...prev,
          cvUpload: file.name + ": " + e.message,
        }));
      }
    }

    setProcessing((prev) => ({ ...prev, fileUpload: false }));
  };

  const langs = [
    "JavaScript",
    "Python",
    "Java",
    "C#",
    "C++",
    "TypeScript",
    "PHP",
    "Swift",
    "Kotlin",
    "Go",
    "Rust",
    "Ruby",
    "SQL",
  ];

  // HOME SCREEN
  if (mode === "home") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">
                ERG Recruitment Suite
              </h1>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to ERG Recruitment Suite
            </h2>
            <p className="text-xl text-gray-600">
              Choose your workflow to get started
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div
              onClick={() => {
                setMode("recruitment");
                setCurrentStage("project-home");
              }}
              className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-blue-500 p-8"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Vacancy Management
                </h3>
              </div>

              <p className="text-gray-600 mb-6 text-lg">
                Complete 6-stage recruitment workflow from job spec to interview
                preparation
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm font-semibold">
                      1
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Job Spec Upload</p>
                    <p className="text-sm text-gray-600">
                      Upload and process job descriptions
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm font-semibold">
                      2
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      Content Generation
                    </p>
                    <p className="text-sm text-gray-600">
                      LinkedIn ads, briefs, emails, phone scripts
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm font-semibold">
                      3
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">CV Scoring</p>
                    <p className="text-sm text-gray-600">
                      Automated candidate analysis with tech skills
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm font-semibold">
                      4
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      Candidate Interview
                    </p>
                    <p className="text-sm text-gray-600">
                      Interview transcripts per candidate
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm font-semibold">
                      5
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      Interview Preparation
                    </p>
                    <p className="text-sm text-gray-600">
                      Professional briefs and checklists
                    </p>
                  </div>
                </div>
              </div>

              <button className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-lg font-semibold">
                Start Recruitment Workflow
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div
              onClick={() => {
                setMode("candidate-to-market");
                setCtmStage(1);
              }}
              className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-purple-500 p-8"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Target className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Candidate to Market
                </h3>
              </div>

              <p className="text-gray-600 mb-6 text-lg">
                Fast 2-stage workflow to market candidates to target companies
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-purple-600 text-sm font-semibold">
                      1
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      CV Summary Generation
                    </p>
                    <p className="text-sm text-gray-600">
                      Create technical and industry-focused marketing summaries
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-purple-600 text-sm font-semibold">
                      2
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Sector Mapping</p>
                    <p className="text-sm text-gray-600">
                      Generate targeted company lists with hiring intelligence
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-8">
                <p className="text-sm text-purple-900 font-medium mb-2">
                  Perfect for:
                </p>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>• Quick candidate positioning</li>
                  <li>• Target company identification</li>
                  <li>• Market intelligence gathering</li>
                  <li>• Rapid candidate-to-role matching</li>
                </ul>
              </div>

              <button className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2 text-lg font-semibold">
                Start Candidate Marketing
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // CANDIDATE TO MARKET MODE
  if (mode === "candidate-to-market") {
    if (showCtmProjectList || !currentCtmProjectId) {
      return (
        <div className="min-h-screen bg-slate-50">
          <header className="bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg">
            <div className="max-w-7xl mx-auto px-6 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">Candidate to Market</h1>
                    <p className="text-purple-100 text-sm">
                      Manage candidate marketing campaigns
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setMode("home")}
                  className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 font-medium"
                >
                  ← Home
                </button>
              </div>
            </div>
          </header>

          <div className="max-w-7xl mx-auto p-6">
            <div className="bg-white rounded-lg border p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Create New Campaign</h2>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newCtmProjectName}
                  onChange={(e) => setNewCtmProjectName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && createCtmProject()}
                  placeholder="Enter candidate name (e.g., John Smith)"
                  className="flex-1 px-4 py-3 border rounded-lg"
                />
                <button
                  onClick={createCtmProject}
                  disabled={!newCtmProjectName.trim()}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  Create Campaign
                </button>
              </div>
            </div>

            {ctmProjects.length > 0 ? (
              <div>
                <h2 className="text-xl font-bold mb-4">
                  Your Campaigns ({ctmProjects.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ctmProjects
                    .sort(
                      (a, b) =>
                        new Date(b.lastUpdated) - new Date(a.lastUpdated)
                    )
                    .map((project) => (
                      <div
                        key={project.id}
                        className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-semibold text-lg">
                            {project.candidateName}
                          </h3>
                          <button
                            onClick={() => deleteCtmProject(project.id)}
                            className="text-red-500 hover:text-red-700"
                            title="Delete campaign"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {project.campaigns?.length || 0} campaign
                          {project.campaigns?.length !== 1 ? "s" : ""}
                        </p>
                        <p className="text-xs text-gray-500 mb-4">
                          Last updated:{" "}
                          {new Date(project.lastUpdated).toLocaleDateString()}
                        </p>
                        <button
                          onClick={() => {
                            setCurrentCtmProjectId(project.id);
                            setShowCtmProjectList(false);
                            setCtmStage(1);
                          }}
                          className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                        >
                          Open Campaign
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border rounded-lg p-8 text-center">
                <Target className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600">
                  No campaigns yet. Create your first candidate campaign above.
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Candidate to Market</h1>
                  <p className="text-purple-100 text-sm">
                    {currentCtmProject?.candidateName || "Campaign"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCtmProjectList(true);
                  setCtmCvFile(null);
                  setCtmSummaries(null);
                  setCtmAnalysis(null);
                }}
                className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 font-medium"
              >
                ← Back to Campaigns
              </button>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setCtmStage(1)}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  ctmStage === 1
                    ? "bg-white text-purple-700"
                    : "bg-purple-500 text-white hover:bg-purple-400"
                }`}
              >
                Stage 1: CV Summary
              </button>
              <button
                onClick={() => setCtmStage(2)}
                disabled={!ctmSummaries}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  ctmStage === 2
                    ? "bg-white text-purple-700"
                    : "bg-purple-500 text-white hover:bg-purple-400 disabled:opacity-50 disabled:cursor-not-allowed"
                }`}
              >
                Stage 2: Sector Mapping
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {ctmStage === 1 && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-md p-8">
                <h2 className="text-3xl font-bold text-slate-900 mb-6">
                  Stage 1: CV Summary Generation
                </h2>
                <p className="text-slate-600 mb-8">
                  Create two 8-bullet marketing summaries: one
                  technical-focused, one industry-focused.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Upload CV
                      </label>
                      <input
                        type="file"
                        onChange={ctmHandleFileUpload}
                        accept=".txt,.pdf,.doc,.docx"
                        className="block w-full text-sm text-slate-500
                          file:mr-4 file:py-3 file:px-6
                          file:rounded-lg file:border-0
                          file:text-sm file:font-semibold
                          file:bg-purple-50 file:text-purple-700
                          hover:file:bg-purple-100
                          cursor-pointer"
                      />
                      {ctmCvFile && (
                        <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          {ctmCvFile.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Target Industry/Domain
                      </label>
                      <input
                        type="text"
                        value={ctmIndustry}
                        onChange={(e) => setCtmIndustry(e.target.value)}
                        placeholder="e.g., FinTech, HealthTech, E-commerce"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Tone
                        </label>
                        <select
                          value={ctmTone}
                          onChange={(e) => setCtmTone(e.target.value)}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="professional">Professional</option>
                          <option value="dynamic">Dynamic</option>
                          <option value="technical">Technical</option>
                          <option value="executive">Executive</option>
                          <option value="confident">Confident</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Length
                        </label>
                        <select
                          value={ctmLength}
                          onChange={(e) => setCtmLength(e.target.value)}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="short">Short (8-10 words)</option>
                          <option value="medium">Medium (12-15 words)</option>
                          <option value="long">Long (15-20 words)</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={ctmGenerateSummaries}
                      disabled={!ctmCvFile || !ctmIndustry || ctmLoading}
                      className="w-full bg-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {ctmLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Generating Summaries...
                        </>
                      ) : (
                        <>
                          <FileText className="w-5 h-5" />
                          Generate CV Summaries
                        </>
                      )}
                    </button>
                  </div>

                  {ctmSummaries && (
                    <div className="space-y-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                            <Code className="w-5 h-5" />
                            Technical Summary
                          </h3>
                          <button
                            onClick={() => ctmCopyToClipboard("technical")}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
                          >
                            {ctmCopied.technical ? (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <ul className="space-y-2 text-sm text-slate-800">
                          {ctmSummaries.technical?.map((bullet, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="font-bold text-blue-600 mt-0.5">
                                {idx + 1}.
                              </span>
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border-2 border-emerald-200">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
                            <Briefcase className="w-5 h-5" />
                            Industry Summary
                          </h3>
                          <button
                            onClick={() => ctmCopyToClipboard("industry")}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm font-medium"
                          >
                            {ctmCopied.industry ? (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <ul className="space-y-2 text-sm text-slate-800">
                          {ctmSummaries.industry?.map((bullet, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="font-bold text-emerald-600 mt-0.5">
                                {idx + 1}.
                              </span>
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {ctmStage === 2 && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-md p-8">
                <h2 className="text-3xl font-bold text-slate-900 mb-6">
                  Stage 2: Sector Mapping & Company Lists
                </h2>
                <p className="text-slate-600 mb-8">
                  Generate two lists: Software companies + Industry companies
                  with hiring intelligence.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Employer Website URL
                    </label>
                    <input
                      type="url"
                      value={ctmEmployerUrl}
                      onChange={(e) => setCtmEmployerUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Sector (Optional)
                    </label>
                    <input
                      type="text"
                      value={ctmSector}
                      onChange={(e) => setCtmSector(e.target.value)}
                      placeholder="Auto-detect"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <button
                  onClick={ctmGenerateAnalysis}
                  disabled={!ctmEmployerUrl || ctmLoading}
                  className="w-full bg-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {ctmLoading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Generating Company Lists... (20-30 seconds)
                    </>
                  ) : (
                    <>
                      <Building2 className="w-6 h-6" />
                      Generate Company Lists
                    </>
                  )}
                </button>
              </div>

              {ctmAnalysis && (
                <>
                  <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-lg">
                    <p className="text-blue-900 font-semibold">
                      Detected Sector: {ctmAnalysis.detectedSector || ctmSector}
                    </p>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-blue-600" />
                          List 1: UK Software/Tech Companies (
                          {ctmAnalysis.softwareCompanies?.length || 0}{" "}
                          companies)
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">
                          UK HQ • 50-5000 employees • Actively hiring software
                          engineers
                        </p>
                      </div>
                      <button
                        onClick={() => ctmCopyCompanyList("software")}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2 text-sm font-medium"
                      >
                        {ctmCopied.softwareList ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy List
                          </>
                        )}
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                              #
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                              Company
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                              Website
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                              HQ Location
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                              Headcount
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                              Growth
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                              Recent Hiring
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                              LinkedIn
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {ctmAnalysis.softwareCompanies?.map(
                            (company, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="px-4 py-3 text-sm text-slate-600">
                                  {idx + 1}
                                </td>
                                <td className="px-4 py-3 text-sm font-medium text-slate-900">
                                  {company.name}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <a
                                    href={company.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    Visit
                                  </a>
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600">
                                  {company.hq}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600">
                                  <div className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    {company.headcount}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                      company.growth === "High"
                                        ? "bg-emerald-100 text-emerald-700"
                                        : company.growth === "Medium"
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-slate-100 text-slate-700"
                                    }`}
                                  >
                                    <TrendingUp className="w-3 h-3" />
                                    {company.growth}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  {company.recentHiring ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                  ) : (
                                    <XCircle className="w-5 h-5 text-slate-300" />
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <a
                                    href={company.linkedinUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    View
                                  </a>
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                          <Briefcase className="w-5 h-5 text-purple-600" />
                          List 2: Companies IN{" "}
                          {ctmAnalysis.detectedSector || ctmSector} Industry (
                          {ctmAnalysis.industryCompanies?.length || 0}{" "}
                          companies)
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">
                          UK HQ • Operating in sector • Hiring software
                          engineers
                        </p>
                      </div>
                      <button
                        onClick={() => ctmCopyCompanyList("industry")}
                        className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-2 text-sm font-medium"
                      >
                        {ctmCopied.industryList ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy List
                          </>
                        )}
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                              #
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                              Company
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                              Website
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                              HQ Location
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                              Headcount
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                              Growth
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                              Recent Hiring
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                              LinkedIn
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {ctmAnalysis.industryCompanies?.map(
                            (company, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="px-4 py-3 text-sm text-slate-600">
                                  {idx + 1}
                                </td>
                                <td className="px-4 py-3 text-sm font-medium text-slate-900">
                                  {company.name}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <a
                                    href={company.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    Visit
                                  </a>
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600">
                                  {company.hq}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600">
                                  <div className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    {company.headcount}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                      company.growth === "High"
                                        ? "bg-emerald-100 text-emerald-700"
                                        : company.growth === "Medium"
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-slate-100 text-slate-700"
                                    }`}
                                  >
                                    <TrendingUp className="w-3 h-3" />
                                    {company.growth}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  {company.recentHiring ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                  ) : (
                                    <XCircle className="w-5 h-5 text-slate-300" />
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <a
                                    href={company.linkedinUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    View
                                  </a>
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Saved Campaigns Section */}
          {currentCtmProject &&
            currentCtmProject.campaigns &&
            currentCtmProject.campaigns.length > 0 && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4">
                  Saved Campaigns ({currentCtmProject.campaigns.length})
                </h2>
                <div className="space-y-4">
                  {currentCtmProject.campaigns
                    .sort(
                      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                    )
                    .map((campaign) => (
                      <div
                        key={campaign.id}
                        className="bg-white border rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">
                              Campaign -{" "}
                              {new Date(
                                campaign.createdAt
                              ).toLocaleDateString()}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Industry: {campaign.industry} | Sector:{" "}
                              {campaign.analysis?.detectedSector || "N/A"}
                            </p>
                          </div>
                          <button
                            onClick={() => deleteCtmCampaign(campaign.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-100 p-2 rounded"
                            title="Delete campaign"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Software Companies</p>
                            <p className="font-semibold text-purple-600">
                              {campaign.analysis?.softwareCompanies?.length ||
                                0}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Industry Companies</p>
                            <p className="font-semibold text-purple-600">
                              {campaign.analysis?.industryCompanies?.length ||
                                0}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Tone</p>
                            <p className="font-semibold capitalize">
                              {campaign.tone}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
        </div>
      </div>
    );
  }

  // RECRUITMENT INTELLIGENCE MODE (existing UI)
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">ERG</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">ERG Vacancy Management</h1>
                <p className="text-sm text-gray-600">Production v2.1</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMode("home")}
                className="text-sm bg-gray-100 px-3 py-2 rounded hover:bg-gray-200 flex items-center gap-2"
              >
                ← Home
              </button>
              {projects.length > 0 && (
                <button
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(projects, null, 2)], {
                      type: "application/json",
                    });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = "erg-backup.json";
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="text-sm bg-gray-100 px-3 py-2 rounded hover:bg-gray-200"
                >
                  Export
                </button>
              )}
              {currentProject && (
                <button
                  onClick={() => {
                    setCurrentProjectId(null);
                    setCurrentStage("project-home");
                    setCvFiles([]);
                  }}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Back
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {currentProject && currentStage !== "project-home" && (
        <nav className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex space-x-8">
              {[
                "overview",
                "content-generation",
                "cv-scorer",
                "candidate-interview",
                "interview",
              ].map((stage) => (
                <button
                  key={stage}
                  onClick={() => setCurrentStage(stage)}
                  className={
                    "py-4 px-2 border-b-2 font-medium text-sm " +
                    (currentStage === stage
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500")
                  }
                >
                  {stage === "overview" && (
                    <LayoutDashboard className="w-4 h-4 inline mr-2" />
                  )}
                  {stage === "content-generation" && (
                    <FileText className="w-4 h-4 inline mr-2" />
                  )}
                  {stage === "cv-scorer" && (
                    <Target className="w-4 h-4 inline mr-2" />
                  )}
                  {stage === "candidate-interview" && (
                    <Code className="w-4 h-4 inline mr-2" />
                  )}
                  {stage === "interview" && (
                    <Users className="w-4 h-4 inline mr-2" />
                  )}
                  {stage
                    .split("-")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ")}
                </button>
              ))}
            </div>
          </div>
        </nav>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">
        {currentStage === "project-home" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Your Projects</h2>
              <button
                onClick={() => setShowNewProjectModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Project
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-lg border p-4"
                >
                  <h3 className="font-semibold mb-2">{project.clientName}</h3>
                  <p className="text-xs text-gray-500 mb-3">
                    Updated:{" "}
                    {new Date(project.lastUpdated).toLocaleDateString()}
                  </p>
                  <button
                    onClick={() => {
                      setCurrentProjectId(project.id);
                      setCurrentStage("overview");
                    }}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Open
                  </button>
                </div>
              ))}
              {projects.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 mb-4">No projects yet</p>
                  <button
                    onClick={() => setShowNewProjectModal(true)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Create project
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {currentStage === "overview" && currentProject && (
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-2xl font-bold mb-4">
              {currentProject.clientName}
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Created: {new Date(currentProject.createdAt).toLocaleDateString()}
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-red-900 mb-2">
                Delete Project
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
                <button
                  disabled={deleteConfirmText !== "DELETE"}
                  onClick={() => {
                    if (deleteConfirmText === "DELETE") {
                      setProjects((prev) =>
                        prev.filter((p) => p.id !== currentProjectId)
                      );
                      setCurrentProjectId(null);
                      setCurrentStage("project-home");
                      setDeleteConfirmText("");
                    }
                  }}
                  className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 disabled:bg-gray-400"
                >
                  Delete
                </button>
              </div>
            </div>
            {currentProject.cvAnalyses &&
              currentProject.cvAnalyses.length > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-purple-900 mb-2">
                    Saved CV Analyses
                  </h3>
                  <p className="text-sm text-purple-700">
                    {currentProject.cvAnalyses.length} candidates analyzed
                  </p>
                </div>
              )}
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => setCurrentStage("content-generation")}
                className="bg-blue-50 border p-4 rounded-lg hover:bg-blue-100 text-left"
              >
                <FileText className="w-8 h-8 text-blue-600 mb-2" />
                <h3 className="font-semibold">Content Generation</h3>
              </button>
              <button
                onClick={() => setCurrentStage("cv-scorer")}
                className="bg-purple-50 border p-4 rounded-lg hover:bg-purple-100 text-left"
              >
                <Target className="w-8 h-8 text-purple-600 mb-2" />
                <h3 className="font-semibold">CV Scorer</h3>
              </button>
              <button
                onClick={() => setCurrentStage("candidate-interview")}
                className="bg-green-50 border p-4 rounded-lg hover:bg-green-100 text-left"
              >
                <Code className="w-8 h-8 text-green-600 mb-2" />
                <h3 className="font-semibold">Candidate Interview</h3>
              </button>
            </div>
          </div>
        )}

        {currentStage === "content-generation" && currentProject && (
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-2xl font-bold mb-6">Content Generation</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Company URL
                  </label>
                  <input
                    type="url"
                    value={formData.companyUrl}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        companyUrl: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Company Info
                  </label>
                  <textarea
                    value={formData.companyInfo}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        companyInfo: e.target.value,
                      }))
                    }
                    rows={4}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Job Description
                  </label>
                  <textarea
                    value={formData.fileContent}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        fileContent: e.target.value,
                      }))
                    }
                    rows={8}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="Paste from Word..."
                  />
                  <div className="mt-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.pdf"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleFileUpload(e.target.files[0]);
                          e.target.value = "";
                        }
                      }}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={processing.fileUpload}
                      className="text-sm bg-gray-100 px-4 py-2 rounded hover:bg-gray-200 flex items-center gap-2"
                    >
                      {processing.fileUpload ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Upload PDF/TXT
                        </>
                      )}
                    </button>
                    {formData.uploadedFile && (
                      <p className="text-xs text-green-600 mt-2">
                        {formData.uploadedFile.name}
                      </p>
                    )}
                    {errors.fileUpload && (
                      <p className="text-xs text-red-600 mt-2">
                        {errors.fileUpload}
                      </p>
                    )}
                  </div>
                </div>
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-4">Customization</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm mb-2">
                        LinkedIn Tone
                      </label>
                      <select
                        value={customization.linkedinTone}
                        onChange={(e) =>
                          setCustomization((prev) => ({
                            ...prev,
                            linkedinTone: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="professional">Professional</option>
                        <option value="casual">Casual</option>
                        <option value="energetic">Energetic</option>
                        <option value="technical">Technical</option>
                        <option value="warm">Warm</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm mb-2">
                        LinkedIn Length: {customization.linkedinLength} words
                      </label>
                      <input
                        type="range"
                        min="150"
                        max="500"
                        step="50"
                        value={customization.linkedinLength}
                        onChange={(e) =>
                          setCustomization((prev) => ({
                            ...prev,
                            linkedinLength: parseInt(e.target.value),
                          }))
                        }
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-2">Brief Tone</label>
                      <select
                        value={customization.briefTone}
                        onChange={(e) =>
                          setCustomization((prev) => ({
                            ...prev,
                            briefTone: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="professional">Professional</option>
                        <option value="casual">Casual</option>
                        <option value="energetic">Energetic</option>
                        <option value="technical">Technical</option>
                        <option value="warm">Warm</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm mb-2">
                        Brief Length: {customization.briefLength} words
                      </label>
                      <input
                        type="range"
                        min="1000"
                        max="3000"
                        step="250"
                        value={customization.briefLength}
                        onChange={(e) =>
                          setCustomization((prev) => ({
                            ...prev,
                            briefLength: parseInt(e.target.value),
                          }))
                        }
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-2">Email Tone</label>
                      <select
                        value={customization.emailTone}
                        onChange={(e) =>
                          setCustomization((prev) => ({
                            ...prev,
                            emailTone: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="professional">Professional</option>
                        <option value="casual">Casual</option>
                        <option value="energetic">Energetic</option>
                        <option value="technical">Technical</option>
                        <option value="warm">Warm</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm mb-2">
                        Email Length: {customization.emailLength} words
                      </label>
                      <input
                        type="range"
                        min="50"
                        max="200"
                        step="25"
                        value={customization.emailLength}
                        onChange={(e) =>
                          setCustomization((prev) => ({
                            ...prev,
                            emailLength: parseInt(e.target.value),
                          }))
                        }
                        className="w-full"
                      />
                    </div>
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-medium mb-3 text-amber-900">
                        Elevator Pitch
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm mb-2">
                            Pitch Tone
                          </label>
                          <select
                            value={customization.elevatorTone}
                            onChange={(e) =>
                              setCustomization((prev) => ({
                                ...prev,
                                elevatorTone: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 border rounded-lg"
                          >
                            <option value="professional">Professional</option>
                            <option value="dynamic">Dynamic</option>
                            <option value="conversational">
                              Conversational
                            </option>
                            <option value="confident">Confident</option>
                            <option value="friendly">Friendly</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm mb-2">
                            Pitch Length: {customization.elevatorLength} words
                            (~{Math.round(customization.elevatorLength / 2.5)}s)
                          </label>
                          <input
                            type="range"
                            min="100"
                            max="250"
                            step="25"
                            value={customization.elevatorLength}
                            onChange={(e) =>
                              setCustomization((prev) => ({
                                ...prev,
                                elevatorLength: parseInt(e.target.value),
                              }))
                            }
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>100 (~40s)</span>
                            <span>175 (~70s)</span>
                            <span>250 (~100s)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={generateAllContent}
                  disabled={
                    processing.contentGeneration || !formData.fileContent
                  }
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg disabled:opacity-50 hover:bg-blue-700 flex items-center justify-center"
                >
                  {processing.contentGeneration ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    "Generate All Content"
                  )}
                </button>
                {errors.generation && (
                  <p className="text-red-600 text-sm">{errors.generation}</p>
                )}
              </div>
              <div className="space-y-6">
                {generatedContent.linkedinAdvert && (
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between mb-3">
                      <h3 className="font-semibold">LinkedIn Advert</h3>
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(
                            generatedContent.linkedinAdvert
                          )
                        }
                        className="text-gray-600 px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 flex items-center gap-2 text-sm"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </button>
                    </div>
                    <div className="bg-gray-50 rounded p-3 text-sm max-h-64 overflow-y-auto">
                      <pre className="whitespace-pre-wrap font-sans">
                        {generatedContent.linkedinAdvert}
                      </pre>
                    </div>
                  </div>
                )}
                {generatedContent.candidateBrief && (
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between mb-3">
                      <h3 className="font-semibold">Candidate Brief</h3>
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(
                            generatedContent.candidateBrief
                          )
                        }
                        className="text-gray-600 px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 flex items-center gap-2 text-sm"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </button>
                    </div>
                    <div className="bg-gray-50 rounded p-3 text-sm max-h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap font-sans">
                        {generatedContent.candidateBrief}
                      </pre>
                    </div>
                  </div>
                )}
                {generatedContent.emailBullets && (
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between mb-3">
                      <h3 className="font-semibold">Email Bullets</h3>
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(
                            generatedContent.emailBullets
                          )
                        }
                        className="text-gray-600 px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 flex items-center gap-2 text-sm"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </button>
                    </div>
                    <div className="bg-gray-50 rounded p-3 text-sm max-h-64 overflow-y-auto">
                      <pre className="whitespace-pre-wrap font-sans">
                        {generatedContent.emailBullets}
                      </pre>
                    </div>
                  </div>
                )}
                {generatedContent.elevatorPitch && (
                  <div className="border-2 border-amber-200 rounded-lg p-4 bg-amber-50">
                    <div className="flex justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-amber-900">
                          Elevator Pitch
                        </h3>
                        <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded-full font-medium">
                          Phone Script
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(
                            generatedContent.elevatorPitch
                          )
                        }
                        className="text-amber-800 px-3 py-2 rounded bg-amber-100 hover:bg-amber-200 flex items-center gap-2 text-sm"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </button>
                    </div>
                    <p className="text-xs text-amber-700 mb-3">
                      Use this script when calling candidates to "sell" the role
                      and generate interest
                    </p>
                    <div className="bg-white rounded p-3 text-sm max-h-64 overflow-y-auto border border-amber-200">
                      <pre className="whitespace-pre-wrap font-sans text-gray-800">
                        {generatedContent.elevatorPitch}
                      </pre>
                    </div>
                  </div>
                )}

                {/* EVP Section */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Employer Value Proposition (EVP)
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Generate a comprehensive selling document covering 8 key
                    areas: career progression, technology, training, culture,
                    salary/benefits, domain, flexibility, and management style.
                  </p>
                  <button
                    onClick={generateEVP}
                    disabled={processing.evpGeneration || !formData.fileContent}
                    className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg disabled:opacity-50 hover:bg-purple-700 flex items-center justify-center"
                  >
                    {processing.evpGeneration ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Generating EVP...
                      </>
                    ) : (
                      "Generate EVP"
                    )}
                  </button>
                  {errors.evp && (
                    <p className="text-red-600 text-sm mt-2">{errors.evp}</p>
                  )}
                </div>

                {generatedContent.evp && (
                  <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                    <div className="flex justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-purple-900">
                          Employer Value Proposition
                        </h3>
                        <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full font-medium">
                          8 Key Areas
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(generatedContent.evp)
                        }
                        className="text-purple-800 px-3 py-2 rounded bg-purple-100 hover:bg-purple-200 flex items-center gap-2 text-sm"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </button>
                    </div>
                    <p className="text-xs text-purple-700 mb-3">
                      Comprehensive selling points across career, tech, culture,
                      benefits, and more
                    </p>
                    <div className="bg-white rounded p-4 text-sm max-h-96 overflow-y-auto border border-purple-200">
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: generatedContent.evp
                            .split("\n")
                            .map((line) => {
                              if (line.startsWith("## "))
                                return `<h3 class="font-bold text-purple-900 mt-4 mb-2 text-base">${line.substring(
                                  3
                                )}</h3>`;
                              if (line.startsWith("- "))
                                return `<p class="ml-4 mb-1">${line}</p>`;
                              if (line.trim())
                                return `<p class="mb-2">${line}</p>`;
                              return "";
                            })
                            .join(""),
                        }}
                      />
                    </div>
                  </div>
                )}

                {!generatedContent.linkedinAdvert && (
                  <div className="border rounded-lg p-8 text-center text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Content appears here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {currentStage === "candidate-interview" && currentProject && (
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-2xl font-bold mb-6">Candidate Interview</h2>

            {/* NEW: Interview Questions Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
              <h3 className="text-xl font-bold text-blue-900 mb-3 flex items-center gap-2">
                <Target className="w-6 h-6" />
                Pre-Interview Technical Validation
              </h3>
              <p className="text-sm text-blue-800 mb-4">
                Generate top 3 essential technical skills and non-technical
                validation questions for recruiter screening
              </p>

              <button
                onClick={generateInterviewQuestions}
                disabled={
                  processing.interviewQuestionsGeneration ||
                  !formData.fileContent
                }
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg disabled:opacity-50 hover:bg-blue-700 flex items-center justify-center gap-2 font-semibold mb-4"
              >
                {processing.interviewQuestionsGeneration ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Interview Questions...
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    Generate Interview Questions
                  </>
                )}
              </button>

              {errors.interviewQuestions && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-800">
                    {errors.interviewQuestions}
                  </p>
                </div>
              )}

              {validationData.interviewQuestions && (
                <div className="space-y-4">
                  <div className="bg-white border-2 border-blue-300 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-blue-900">
                        Top 3 Essential Technical Skills & Questions
                      </h4>
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(
                            validationData.interviewQuestions
                          )
                        }
                        className="text-blue-700 px-3 py-2 rounded bg-blue-100 hover:bg-blue-200 flex items-center gap-2 text-sm"
                      >
                        <Copy className="w-4 h-4" />
                        Copy Questions
                      </button>
                    </div>
                    <p className="text-xs text-blue-700 mb-3">
                      Use these questions during initial screening calls to
                      validate technical expertise
                    </p>
                    <div className="bg-blue-50 rounded p-4 max-h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800">
                        {validationData.interviewQuestions}
                      </pre>
                    </div>
                  </div>

                  {/* Candidate-Specific Interview Transcripts */}
                  <div className="bg-white border-2 border-green-300 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-green-900">
                        Candidate Interview Transcripts
                      </h4>
                      <div className="text-xs text-green-700 bg-green-100 px-3 py-1 rounded">
                        Used in CV Scoring & Interview Prep
                      </div>
                    </div>
                    <p className="text-xs text-green-700 mb-4">
                      Select a candidate and paste their interview transcript.
                      Each candidate has their own transcript box.
                    </p>

                    {currentProject.cvAnalyses &&
                    currentProject.cvAnalyses.length > 0 ? (
                      <div className="space-y-4">
                        {currentProject.cvAnalyses.map((cv) => {
                          const candidateName = cv.candidateName || cv.fileName;
                          return (
                            <div
                              key={cv.id}
                              className="border border-green-200 rounded-lg p-4 bg-green-50"
                            >
                              <h5 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                {candidateName}
                                <span className="text-xs font-normal text-green-700">
                                  (Score: {cv.analysis.overallScore})
                                </span>
                              </h5>
                              <div className="mb-2 flex justify-between items-center">
                                <p className="text-xs text-gray-600">
                                  Transcript for this candidate
                                </p>
                                <span
                                  className={`text-xs ${
                                    (currentProject.candidateTranscripts?.[
                                      candidateName
                                    ]
                                      ?.split(/\s+/)
                                      .filter((w) => w).length || 0) > 10000
                                      ? "text-red-600 font-semibold"
                                      : "text-gray-500"
                                  }`}
                                >
                                  {currentProject.candidateTranscripts?.[
                                    candidateName
                                  ]
                                    ?.split(/\s+/)
                                    .filter((w) => w).length || 0}{" "}
                                  / 10,000 words
                                </span>
                              </div>
                              <textarea
                                value={
                                  currentProject.candidateTranscripts?.[
                                    candidateName
                                  ] || ""
                                }
                                onChange={(e) => {
                                  const wordCount = e.target.value
                                    .split(/\s+/)
                                    .filter((w) => w).length;
                                  if (wordCount <= 10000) {
                                    setProjects((prev) =>
                                      prev.map((p) => {
                                        if (p.id === currentProjectId) {
                                          return {
                                            ...p,
                                            candidateTranscripts: {
                                              ...(p.candidateTranscripts || {}),
                                              [candidateName]: e.target.value,
                                            },
                                            lastUpdated:
                                              new Date().toISOString(),
                                          };
                                        }
                                        return p;
                                      })
                                    );
                                  }
                                }}
                                rows={12}
                                placeholder={`Paste ${candidateName}'s interview transcript or answers here (max 10,000 words)...\n\nExample:\nSKILL 1: React\nQ1: Tell me about a recent React project...\nA: I worked on a large-scale e-commerce platform using React 18 with TypeScript...\n\nQ2: How have you handled state management?\nA: We used Redux Toolkit for global state and React Context for component-level state...`}
                                className="w-full px-4 py-3 border-2 border-green-200 rounded-lg focus:border-green-400 focus:outline-none text-sm font-mono bg-white"
                              />
                            </div>
                          );
                        })}
                        <div className="flex items-start gap-2 text-xs text-green-800 bg-green-50 p-3 rounded border border-green-200">
                          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <p>
                            <strong>Tip:</strong> These transcripts will be used
                            in the Interview Preparation section to analyze each
                            candidate's motivations and generate personalized
                            interview briefs.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 border border-green-200 rounded-lg bg-green-50">
                        <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">No candidates analyzed yet</p>
                        <p className="text-xs mt-1">
                          Go to CV Scorer to analyze candidates first
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* NEW: Technical Interview Overview Section */}
            <div className="border-t-2 pt-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">
                Technical Interview Overview
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Generate a detailed breakdown of technical skills demonstrated
                in the interview transcript, aligned with the role requirements.
              </p>

              <div className="max-w-4xl space-y-4">
                {currentProject.cvAnalyses &&
                currentProject.cvAnalyses.length > 0 ? (
                  <>
                    {currentProject.cvAnalyses.map((cv) => {
                      const candidateName = cv.candidateName || cv.fileName;
                      const hasTranscript =
                        currentProject.candidateTranscripts?.[candidateName];
                      const technicalOverview =
                        currentProject.technicalOverviews?.[candidateName];

                      return (
                        <div
                          key={cv.id}
                          className="border-2 border-blue-100 rounded-lg p-4 bg-blue-50"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Users className="w-5 h-5 text-blue-600" />
                              <div>
                                <h5 className="font-semibold text-blue-900">
                                  {candidateName}
                                </h5>
                                <p className="text-xs text-gray-600">
                                  Score: {cv.analysis.overallScore}/100
                                </p>
                              </div>
                            </div>

                            {hasTranscript ? (
                              <div className="flex items-center gap-2 text-xs text-green-700 bg-green-100 px-3 py-1 rounded-full">
                                <CheckCircle className="w-3 h-3" />
                                Transcript available
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                                <AlertCircle className="w-3 h-3" />
                                No transcript
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() =>
                              generateTechnicalOverview(candidateName)
                            }
                            disabled={
                              !hasTranscript ||
                              processing.technicalOverviewGeneration
                            }
                            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 hover:bg-blue-700 flex items-center justify-center mb-3"
                          >
                            {processing.technicalOverviewGeneration ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                Generating Overview...
                              </>
                            ) : (
                              <>
                                <Code className="w-5 h-5 mr-2" />
                                Technical Interview Overview Generate
                              </>
                            )}
                          </button>

                          {!hasTranscript && (
                            <p className="text-xs text-amber-600 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Add transcript above to generate overview
                            </p>
                          )}

                          {technicalOverview && (
                            <div className="mt-4 border rounded-lg p-4 bg-white">
                              <div className="flex justify-between items-center mb-3">
                                <h6 className="font-semibold text-gray-800">
                                  Technical Skills Breakdown
                                </h6>
                                <button
                                  onClick={() =>
                                    navigator.clipboard.writeText(
                                      technicalOverview
                                    )
                                  }
                                  className="text-gray-600 px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 flex items-center gap-2 text-xs"
                                >
                                  <Copy className="w-3 h-3" />
                                  Copy
                                </button>
                              </div>
                              <div className="bg-gray-50 rounded p-3 text-sm max-h-96 overflow-y-auto">
                                <pre className="whitespace-pre-wrap font-sans">
                                  {technicalOverview}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                    <Code className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No candidates to analyze</p>
                    <p className="text-xs mt-1">Upload and score CVs first</p>
                  </div>
                )}

                {errors.technicalOverview && (
                  <p className="text-red-600 text-sm flex items-center gap-1">
                    <XCircle className="w-4 h-4" />
                    {errors.technicalOverview}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {currentStage === "cv-scorer" && currentProject && (
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-2xl font-bold mb-6">CV Scorer</h2>
            <div>
              <input
                ref={cvFileInputRef}
                type="file"
                multiple
                accept=".pdf,.txt,.doc,.docx"
                onChange={(e) => {
                  if (e.target.files) {
                    handleCvFiles(e.target.files);
                    e.target.value = "";
                  }
                }}
                className="hidden"
              />
              <div
                onClick={() => cvFileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleCvFiles(e.dataTransfer.files);
                }}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50 cursor-pointer"
              >
                <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm font-medium text-gray-700">
                  Click or drag CVs
                </p>
                <p className="text-xs text-gray-500">PDF, DOC, DOCX, or TXT</p>
              </div>
              {cvFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h3 className="font-semibold text-sm">
                    Uploaded CVs ({cvFiles.length})
                  </h3>
                  {cvFiles.map((cvFile) => (
                    <div
                      key={cvFile.id}
                      className="flex items-center justify-between bg-gray-50 p-3 rounded border"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{cvFile.file.name}</span>
                        {cvFile.analysis && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <button
                        onClick={() =>
                          setCvFiles((prev) =>
                            prev.filter((f) => f.id !== cvFile.id)
                          )
                        }
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={async () => {
                      for (const cvFile of cvFiles) {
                        if (!cvFile.analysis) {
                          await analyzeCv(cvFile.id);
                          await new Promise((r) => setTimeout(r, 1000));
                        }
                      }
                    }}
                    disabled={
                      processing.cvAnalysis || cvFiles.every((f) => f.analysis)
                    }
                    className="w-full mt-2 bg-purple-600 text-white px-6 py-3 rounded-lg disabled:opacity-50 hover:bg-purple-700 flex items-center justify-center"
                  >
                    {processing.cvAnalysis ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Analyzing...
                      </>
                    ) : cvFiles.every((f) => f.analysis) ? (
                      "All Analyzed"
                    ) : (
                      "Analyze All CVs"
                    )}
                  </button>
                </div>
              )}
              {errors.cvAnalysis && (
                <p className="text-red-600 text-sm mt-2">{errors.cvAnalysis}</p>
              )}

              {/* Display stored CV analyses from project */}
              {currentProject.cvAnalyses &&
                currentProject.cvAnalyses.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold text-sm mb-3">
                      Stored Candidates ({currentProject.cvAnalyses.length})
                    </h3>
                    <div className="space-y-2">
                      {currentProject.cvAnalyses.map((cv) => (
                        <div
                          key={cv.id}
                          className="flex items-center justify-between bg-green-50 p-3 rounded border border-green-200"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium">
                              {cv.fileName}
                            </span>
                            <span className="text-xs text-gray-500">
                              Score: {cv.analysis.overallScore}
                            </span>
                          </div>
                          <button
                            onClick={() => deleteCandidate(cv.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-100 p-1 rounded"
                            title="Delete candidate"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <div className="mt-6 space-y-6">
                {/* Display newly uploaded and analyzed CVs */}
                {cvFiles
                  .filter((f) => f.analysis)
                  .sort(
                    (a, b) => b.analysis.overallScore - a.analysis.overallScore
                  )
                  .map((cvFile) => (
                    <div
                      key={cvFile.id}
                      className="border-l-4 border-blue-600 rounded-lg p-4 shadow-sm relative"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-semibold text-lg">
                          {cvFile.file.name}
                        </h3>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          New Upload
                        </span>
                      </div>
                      <div className="border rounded-lg p-4 mb-4">
                        <h4 className="font-semibold mb-3">Overall Score</h4>
                        <div className="flex items-center">
                          <div className="text-4xl font-bold text-blue-600">
                            {cvFile.analysis.overallScore}
                          </div>
                          <div className="ml-2 text-gray-500">/100</div>
                        </div>
                      </div>

                      {cvFile.analysis.skillAnalysis &&
                        cvFile.analysis.jobTechSkills && (
                          <div className="border-2 border-green-200 rounded-lg p-4 mb-4 bg-green-50">
                            <h4 className="font-semibold mb-3 text-green-900">
                              Candidate Skill Match Analysis
                            </h4>
                            <div className="space-y-3">
                              {cvFile.analysis.jobTechSkills.map((skill, i) => (
                                <div
                                  key={i}
                                  className="pb-3 border-b border-green-200 last:border-b-0 last:pb-0"
                                >
                                  <h5 className="font-semibold text-sm text-green-800 mb-1">
                                    {skill}
                                  </h5>
                                  <p className="text-sm text-gray-700 leading-relaxed">
                                    {cvFile.analysis.skillAnalysis[skill] ||
                                      "No analysis available for this skill."}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      <div className="border rounded-lg p-4 mb-4">
                        <h4 className="font-semibold mb-2">Summary</h4>
                        <div className="text-sm text-gray-700 space-y-2">
                          {cvFile.analysis.recruiterSummary
                            .split("\n\n")
                            .map((para, i) => (
                              <p key={i}>{para}</p>
                            ))}
                        </div>
                      </div>
                      <div className="border rounded-lg p-4 mb-4">
                        <h4 className="font-semibold mb-2">Strengths</h4>
                        <ul className="space-y-1">
                          {cvFile.analysis.keyStrengths?.map((s, i) => (
                            <li key={i} className="text-sm flex items-start">
                              <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {cvFile.analysis.additionalValue &&
                        cvFile.analysis.additionalValue.length > 0 && (
                          <div className="border rounded-lg p-4 mb-4 bg-blue-50 border-blue-200">
                            <h4 className="font-semibold mb-2 text-blue-900">
                              Additional Value
                            </h4>
                            <ul className="space-y-1">
                              {cvFile.analysis.additionalValue.map((v, i) => (
                                <li
                                  key={i}
                                  className="text-sm flex items-start"
                                >
                                  <CheckCircle className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0" />
                                  {v}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      <div
                        className={
                          "border rounded-lg p-4 " +
                          (cvFile.analysis.verdict.color === "green"
                            ? "bg-green-50 border-green-200"
                            : "bg-amber-50 border-amber-200")
                        }
                      >
                        <p className="font-semibold">
                          {cvFile.analysis.verdict.decision}
                        </p>
                        <p className="text-sm mt-1">
                          {cvFile.analysis.verdict.description}
                        </p>
                      </div>
                    </div>
                  ))}

                {/* Display stored CV analyses from project with full details */}
                {currentProject.cvAnalyses &&
                  currentProject.cvAnalyses.length > 0 &&
                  currentProject.cvAnalyses
                    .sort(
                      (a, b) =>
                        b.analysis.overallScore - a.analysis.overallScore
                    )
                    .map((cv) => (
                      <div
                        key={cv.id}
                        className="border-l-4 border-green-600 rounded-lg p-4 shadow-sm relative"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="font-semibold text-lg">
                            {cv.fileName}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Stored
                            </span>
                            <button
                              onClick={() => deleteCandidate(cv.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-100 p-2 rounded"
                              title="Delete candidate"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="border rounded-lg p-4 mb-4">
                          <h4 className="font-semibold mb-3">Overall Score</h4>
                          <div className="flex items-center">
                            <div className="text-4xl font-bold text-green-600">
                              {cv.analysis.overallScore}
                            </div>
                            <div className="ml-2 text-gray-500">/100</div>
                          </div>
                        </div>

                        {cv.analysis.skillAnalysis &&
                          cv.analysis.jobTechSkills && (
                            <div className="border-2 border-green-200 rounded-lg p-4 mb-4 bg-green-50">
                              <h4 className="font-semibold mb-3 text-green-900">
                                Candidate Skill Match Analysis
                              </h4>
                              <div className="space-y-3">
                                {cv.analysis.jobTechSkills.map((skill, i) => (
                                  <div
                                    key={i}
                                    className="pb-3 border-b border-green-200 last:border-b-0 last:pb-0"
                                  >
                                    <h5 className="font-semibold text-sm text-green-800 mb-1">
                                      {skill}
                                    </h5>
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                      {cv.analysis.skillAnalysis[skill] ||
                                        "No analysis available for this skill."}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        <div className="border rounded-lg p-4 mb-4">
                          <h4 className="font-semibold mb-2">Summary</h4>
                          <div className="text-sm text-gray-700 space-y-2">
                            {cv.analysis.recruiterSummary
                              .split("\n\n")
                              .map((para, i) => (
                                <p key={i}>{para}</p>
                              ))}
                          </div>
                        </div>
                        <div className="border rounded-lg p-4 mb-4">
                          <h4 className="font-semibold mb-2">Strengths</h4>
                          <ul className="space-y-1">
                            {cv.analysis.keyStrengths?.map((s, i) => (
                              <li key={i} className="text-sm flex items-start">
                                <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                        {cv.analysis.additionalValue &&
                          cv.analysis.additionalValue.length > 0 && (
                            <div className="border rounded-lg p-4 mb-4 bg-blue-50 border-blue-200">
                              <h4 className="font-semibold mb-2 text-blue-900">
                                Additional Value
                              </h4>
                              <ul className="space-y-1">
                                {cv.analysis.additionalValue.map((v, i) => (
                                  <li
                                    key={i}
                                    className="text-sm flex items-start"
                                  >
                                    <CheckCircle className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0" />
                                    {v}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        <div
                          className={
                            "border rounded-lg p-4 " +
                            (cv.analysis.verdict.color === "green"
                              ? "bg-green-50 border-green-200"
                              : "bg-amber-50 border-amber-200")
                          }
                        >
                          <p className="font-semibold">
                            {cv.analysis.verdict.decision}
                          </p>
                          <p className="text-sm mt-1">
                            {cv.analysis.verdict.description}
                          </p>
                        </div>
                      </div>
                    ))}
              </div>
            </div>
          </div>
        )}

        {currentStage === "interview" && currentProject && (
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-2xl font-bold mb-6">Interview Preparation</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Select Candidate
                  </label>
                  <select
                    value={interviewData.selectedCandidate}
                    onChange={(e) =>
                      setInterviewData((prev) => ({
                        ...prev,
                        selectedCandidate: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Choose a candidate...</option>
                    {currentProject.cvAnalyses &&
                      currentProject.cvAnalyses.map((cv) => (
                        <option
                          key={cv.id}
                          value={cv.candidateName || cv.fileName}
                        >
                          {cv.candidateName || cv.fileName} (Score:{" "}
                          {cv.analysis.overallScore})
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Interview Duration
                  </label>
                  <input
                    type="text"
                    value={interviewData.duration}
                    onChange={(e) =>
                      setInterviewData((prev) => ({
                        ...prev,
                        duration: e.target.value,
                      }))
                    }
                    placeholder="e.g., 60 minutes"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Interview Format
                  </label>
                  <input
                    type="text"
                    value={interviewData.format}
                    onChange={(e) =>
                      setInterviewData((prev) => ({
                        ...prev,
                        format: e.target.value,
                      }))
                    }
                    placeholder="e.g., Video call, In-person, Panel"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Focus Areas
                  </label>
                  <input
                    type="text"
                    value={interviewData.focus}
                    onChange={(e) =>
                      setInterviewData((prev) => ({
                        ...prev,
                        focus: e.target.value,
                      }))
                    }
                    placeholder="e.g., Technical skills, Culture fit"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Agenda / Special Notes
                  </label>
                  <textarea
                    value={interviewData.agenda}
                    onChange={(e) =>
                      setInterviewData((prev) => ({
                        ...prev,
                        agenda: e.target.value,
                      }))
                    }
                    rows={4}
                    placeholder="Any specific topics or structure..."
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium mb-2 text-purple-900">
                    <span className="flex items-center gap-2">
                      Candidate Motivations
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        Required
                      </span>
                    </span>
                  </label>

                  {interviewData.selectedCandidate &&
                    (() => {
                      const candidate = currentProject.cvAnalyses.find(
                        (cv) => cv.fileName === interviewData.selectedCandidate
                      );
                      const candidateName =
                        candidate?.candidateName || candidate?.fileName;
                      const hasTranscript =
                        currentProject.candidateTranscripts?.[candidateName];

                      return (
                        <div className="mb-3">
                          {hasTranscript ? (
                            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                              <CheckCircle className="w-4 h-4" />
                              <span>
                                Transcript available for {candidateName}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                              <AlertCircle className="w-4 h-4" />
                              <span>
                                No transcript found - add in Candidate Interview
                                section
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                  <button
                    onClick={analyzeMotivations}
                    disabled={
                      processing.motivationAnalysis ||
                      !interviewData.selectedCandidate
                    }
                    className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg disabled:opacity-50 hover:bg-purple-700 flex items-center justify-center mb-3"
                  >
                    {processing.motivationAnalysis ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Analyzing Transcript...
                      </>
                    ) : (
                      <>
                        <Target className="w-5 h-5 mr-2" />
                        Analyze Candidate Motivations
                      </>
                    )}
                  </button>

                  <textarea
                    value={interviewData.hiringPriorities}
                    onChange={(e) =>
                      setInterviewData((prev) => ({
                        ...prev,
                        hiringPriorities: e.target.value,
                      }))
                    }
                    rows={5}
                    placeholder="Click 'Analyze Candidate Motivations' to extract motivations from their interview transcript...&#10;&#10;Example output:&#10;- Seeks technical leadership opportunities&#10;- Values work-life balance and flexible working&#10;- Interested in working with modern tech stack&#10;- Motivated by mentorship and learning opportunities"
                    className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-400 focus:outline-none"
                  />
                  <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    You can review and edit the analyzed motivations before
                    generating briefs
                  </p>
                  {errors.motivation && (
                    <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      {errors.motivation}
                    </p>
                  )}
                </div>
                <button
                  onClick={generateInterviewBrief}
                  disabled={
                    processing.interviewGeneration ||
                    !interviewData.selectedCandidate ||
                    !interviewData.duration ||
                    !interviewData.hiringPriorities
                  }
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg disabled:opacity-50 hover:bg-blue-700 flex items-center justify-center"
                >
                  {processing.interviewGeneration ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Generating Interview Briefs...
                    </>
                  ) : (
                    <>
                      <Briefcase className="w-5 h-5 mr-2" />
                      Generate Interview Briefs
                    </>
                  )}
                </button>
                {!interviewData.hiringPriorities &&
                  interviewData.selectedCandidate && (
                    <p className="text-amber-600 text-sm mt-2 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Please analyze candidate motivations first
                    </p>
                  )}
                {errors.interview && (
                  <p className="text-red-600 text-sm mt-2">
                    {errors.interview}
                  </p>
                )}
              </div>
              <div className="space-y-6">
                {interviewData.professionalBrief && (
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between mb-3">
                      <h3 className="font-semibold">Client Preparation</h3>
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(
                            interviewData.professionalBrief
                          )
                        }
                        className="text-gray-600 px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 flex items-center gap-2 text-sm"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </button>
                    </div>
                    <div className="bg-gray-50 rounded p-3 text-sm max-h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap font-sans">
                        {interviewData.professionalBrief}
                      </pre>
                    </div>
                  </div>
                )}
                {interviewData.coachingBrief && (
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between mb-3">
                      <h3 className="font-semibold">Candidate Preparation</h3>
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(
                            interviewData.coachingBrief
                          )
                        }
                        className="text-gray-600 px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 flex items-center gap-2 text-sm"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </button>
                    </div>
                    <div className="bg-green-50 rounded p-3 text-sm max-h-64 overflow-y-auto border border-green-200">
                      <pre className="whitespace-pre-wrap font-sans">
                        {interviewData.coachingBrief}
                      </pre>
                    </div>
                  </div>
                )}
                {interviewData.checklist && (
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between mb-3">
                      <h3 className="font-semibold">
                        Candidate Pre-Interview Checklist
                      </h3>
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(interviewData.checklist)
                        }
                        className="text-gray-600 px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 flex items-center gap-2 text-sm"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </button>
                    </div>
                    <p className="text-xs text-blue-700 mb-3">
                      10 tasks for the candidate to complete before the
                      interview
                    </p>
                    <div className="bg-blue-50 rounded p-3 text-sm border border-blue-200">
                      <pre className="whitespace-pre-wrap font-sans">
                        {interviewData.checklist}
                      </pre>
                    </div>
                  </div>
                )}
                {!interviewData.professionalBrief && (
                  <div className="border rounded-lg p-8 text-center text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Interview briefs appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Create Project</h3>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Client/Vacancy Name"
              className="w-full px-3 py-2 border rounded-lg mb-4"
              onKeyPress={(e) => {
                if (e.key === "Enter" && newProjectName.trim()) createProject();
              }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowNewProjectModal(false);
                  setNewProjectName("");
                }}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={createProject}
                disabled={!newProjectName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ERGRecruitmentSystem;
