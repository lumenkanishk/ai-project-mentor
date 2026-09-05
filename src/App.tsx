import { useState, useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { GoogleGenAI } from '@google/genai';
import mermaid from 'mermaid';
import { 
  GraduationCap, 
  Lightbulb, 
  Code2, 
  Target,
  ChevronRight,
  ChevronLeft,
  X,
  Plus,
  Rocket,
  Layers,
  Map,
  Cpu,
  Zap,
  Download,
  Printer,
  CheckSquare,
  Square,
  BrainCircuit,
  Terminal,
  Server,
  Cloud,
  MessageCircle,
  Send,
  Sun,
  Moon,
  Maximize2
} from 'lucide-react';

// --- Types ---
interface FormData {
  major: string;
  domain: string;
  skills: string[];
  teamSize: number | '';
  duration: number | '';
  projectType: string;
}

interface BriefIdea {
  title: string;
  pitch: string;
  feasibility_score: number;
}

interface ProjectIdea {
  project_title: string;
  one_line_pitch: string;
  hackathon_theme: string;
  innovation_factor: string;
  core_features: string[];
  tech_stack: {
    frontend: string[];
    backend: string[];
    database: string[];
    ai_tools: string[];
  };
  deployment_guide: string[];
  architecture_mermaid: string;
  skill_gap_tool_to_learn: {
    name: string;
    explanation: string;
  };
  four_week_roadmap: {
    week_number: number;
    milestone_title: string;
    tasks: string[];
  }[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

// --- Constants ---
const domains = ["FinTech", "HealthTech", "Smart Cities", "EdTech", "AgriTech", "Cybersecurity", "AI/ML", "Web3/Crypto", "Disaster Relief"];
const targetLevels = ["Hackathon", "Capstone Project", "Mini-Project", "Research Paper", "Startup MVP"];
const suggestedSkills = ["Python", "C++", "React", "Vite", "Streamlit", "FAISS", "LangChain", "Node.js", "Docker", "SQL", "MongoDB", "TensorFlow", "PyTorch"];
const loadingTexts = ["Analyzing skills...", "Brainstorming concepts...", "Structuring roadmaps...", "Mapping architecture...", "Planning deployment..."];
const tagColors = [
  "bg-accent-light/10 text-accent-light border-accent-light/30",
  "bg-accent-alt/10 text-accent-alt border-accent-alt/30",
  "bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-white border-gray-300 dark:border-white/20"
];

// --- Hooks ---
function useClickOutside(ref: React.RefObject<any>, handler: () => void) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) return;
      handler();
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

// --- Components ---

const MermaidDiagram = ({ chart, isDark }: { chart: string, isDark: boolean }) => {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: isDark ? 'dark' : 'default' });
    const renderChart = async () => {
      try {
        const { svg: renderedSvg } = await mermaid.render(id, chart);
        setSvg(renderedSvg);
      } catch (err) {
        console.error("Mermaid parsing error", err);
        setError(true);
      }
    };
    if (chart) renderChart();
  }, [chart, isDark, id]);

  if (error) return <div className="text-red-400 text-sm p-4 border border-red-500/30 rounded-lg">Failed to render architecture diagram.</div>;
  
  const content = svg ? (
    <div 
      dangerouslySetInnerHTML={{ __html: svg }} 
      className="flex justify-center w-full [&_svg]:max-w-full [&_svg]:h-auto cursor-pointer"
      onClick={() => setIsFullscreen(true)}
      role="button"
      tabIndex={0}
      aria-label="Enlarge architecture diagram"
    />
  ) : (
    <div className="h-32 flex items-center justify-center text-gray-500 dark:text-zinc-400">Rendering Architecture...</div>
  );

  return (
    <>
      <div className="relative group">
        {content}
        {svg && (
          <button 
            onClick={() => setIsFullscreen(true)}
            className="absolute top-2 right-2 p-2 bg-gray-200/80 dark:bg-zinc-800/80 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Maximize diagram"
          >
            <Maximize2 className="w-4 h-4 text-gray-800 dark:text-white" />
          </button>
        )}
      </div>

      {isFullscreen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8">
          <button 
            onClick={() => setIsFullscreen(false)}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[110]"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
          <div 
            dangerouslySetInnerHTML={{ __html: svg }} 
            className="w-full h-full flex justify-center items-center overflow-auto [&_svg]:w-auto [&_svg]:h-auto [&_svg]:max-w-full [&_svg]:max-h-full"
          />
        </div>
      )}
    </>
  );
};

const DoubtSolver = ({ projectContext }: { projectContext: ProjectIdea }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const chatSessionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  const initChat = () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) return;
    const ai = new GoogleGenAI({ apiKey });
    chatSessionRef.current = ai.chats.create({
      model: 'gemini-3.6-flash',
      config: {
        systemInstruction: `You are the "YuktiSetu Doubt Solver". An expert engineering mentor.
Context: The student is building this exact project: ${JSON.stringify(projectContext)}.
Your goal is to answer their technical questions concisely and accurately based on their tech stack and roadmap.`
      }
    });
    setMessages([{ id: Date.now().toString(), role: 'model', text: `Hi! I'm your YuktiSetu mentor. Need help building ${projectContext.project_title}? Ask away!` }]);
  };

  const handleSend = async () => {
    if (!input.trim() || !chatSessionRef.current) return;
    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    try {
      const response = await chatSessionRef.current.sendMessage({ message: userMessage.text });
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: response.text }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Sorry, I encountered an error connecting to the mentorship network." }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => { setIsOpen(true); if (!chatSessionRef.current) initChat(); }}
        className="fixed bottom-6 right-6 p-4 bg-accent-light text-white rounded-full shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:scale-105 transition-transform z-40 print:hidden"
        aria-label="Open Doubt Solver Chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 sm:w-96 backdrop-blur-xl bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/50 dark:border-zinc-800/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-40 animate-in slide-in-from-bottom-4 print:hidden h-[500px]">
      <div className="p-4 bg-zinc-100/80 dark:bg-zinc-950/80 border-b border-zinc-200/50 dark:border-zinc-800/60 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-accent-light" />
          <h3 className="font-bold text-gray-900 dark:text-white">Doubt Solver</h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors" aria-label="Close chat">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${m.role === 'user' ? 'bg-accent-light text-white rounded-br-none' : 'bg-white/70 dark:bg-zinc-800/70 border border-zinc-200/50 dark:border-zinc-700/50 text-gray-900 dark:text-white rounded-bl-none'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white/70 dark:bg-zinc-800/70 border border-zinc-200/50 dark:border-zinc-700/50 rounded-2xl rounded-bl-none px-4 py-3 flex gap-1 items-center">
              <div className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-3 bg-zinc-50/80 dark:bg-zinc-950/80 border-t border-zinc-200/50 dark:border-zinc-800/60">
        <div className="relative">
          <input 
            type="text" placeholder="Ask a technical question..."
            value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700/60 rounded-xl pl-4 pr-10 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:border-accent-light shadow-inner"
            aria-label="Chat input field"
          />
          <button 
            onClick={handleSend} disabled={isTyping}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-accent-light hover:bg-accent-light/10 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const [step, setStep] = useState(0); 
  const [formData, setFormData] = useState<FormData>({ major: '', domain: '', skills: [], teamSize: '', duration: '', projectType: '' });
  const [skillInput, setSkillInput] = useState('');
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [error, setError] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [ideas, setIdeas] = useState<BriefIdea[] | null>(null);
  
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [projectData, setProjectData] = useState<ProjectIdea | null>(null);
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});
  
  const skillInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => setShowSkillDropdown(false));

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isGenerating || isGeneratingRoadmap) {
      interval = setInterval(() => {
        setLoadingIndex(i => (i + 1) % loadingTexts.length);
      }, 1500); 
    }
    return () => clearInterval(interval);
  }, [isGenerating, isGeneratingRoadmap]);

  const handleKeyDownDropdown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowSkillDropdown(false);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      addSkill(skillInput);
    }
  };

  const handleNext = () => {
    setError('');
    if (step === 1 && (!formData.major.trim() || !formData.domain)) return setError('Please fill in all fields to continue.');
    if (step === 2 && formData.skills.length === 0) return setError('Please add at least one technical skill.');
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError('');
    setStep((prev) => prev - 1);
  };

  const generateIdeas = async () => {
    setIsGenerating(true);
    setError('');
    setStep(4);
    setIdeas(null);
    setProjectData(null);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Gemini API key is missing from environment variables.");
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are an elite hackathon judge.
Analyze: Major: ${formData.major}, Domain: ${formData.domain}, Skills: ${formData.skills.join(', ')}
Team Size: ${formData.teamSize}, Duration: ${formData.duration} weeks, Target Level: ${formData.projectType}
Return 4 unique project concepts.
Return a tightly minified JSON structure without any unnecessary whitespace in this exact format:
[{"title":"...","pitch":"...","feasibility_score":8}]`;
      const response = await ai.models.generateContent({ model: 'gemini-3.6-flash', contents: prompt, config: { responseMimeType: 'application/json' } });
      const text = response.text;
      if (!text) throw new Error("Received empty response from Gemini API.");
      const parsedData = JSON.parse(text) as BriefIdea[];
      setIdeas(parsedData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate ideas. Please try again.');
      setStep(3);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateRoadmap = async (idea: BriefIdea) => {
    setIsGeneratingRoadmap(true);
    setError('');
    setStep(5);
    setCheckedTasks({});
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Gemini API key missing!");
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are an elite software architect.
Project: ${idea.title} - ${idea.pitch}
Skills: ${formData.skills.join(', ')}, Duration: ${formData.duration} weeks
Flesh out the detailed architecture and roadmap. Include Mermaid.js string.
Return a tightly minified JSON structure without any unnecessary whitespace in this exact format:
{"project_title":"...","one_line_pitch":"...","hackathon_theme":"...","innovation_factor":"...","core_features":["..."],"tech_stack":{"frontend":["..."],"backend":["..."],"database":["..."],"ai_tools":["..."]},"deployment_guide":["..."],"architecture_mermaid":"graph TD; A-->B;","skill_gap_tool_to_learn":{"name":"...","explanation":"..."},"four_week_roadmap":[{"week_number":1,"milestone_title":"...","tasks":["..."]}]}`;
      const response = await ai.models.generateContent({ model: 'gemini-3.6-flash', contents: prompt, config: { responseMimeType: 'application/json' } });
      const text = response.text;
      if (!text) throw new Error("Received empty response from Gemini API.");
      const parsedData = JSON.parse(text) as ProjectIdea;
      setProjectData(parsedData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate roadmap. Please try again.');
      setStep(4);
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  const handleSubmit = () => {
    setError('');
    if (!formData.teamSize || formData.teamSize < 1 || formData.teamSize > 4) return setError('Team size must be between 1 and 4.');
    if (!formData.duration || formData.duration < 1 || formData.duration > 24) return setError('Please enter a valid duration (1-24 weeks).');
    if (!formData.projectType) return setError('Please select a target level.');
    generateIdeas();
  };

  const addSkill = (skill: string) => {
    skill = skill.trim();
    if (skill && !formData.skills.includes(skill)) {
      setFormData({ ...formData, skills: [...formData.skills, skill] });
      setSkillInput('');
      setShowSkillDropdown(false);
      skillInputRef.current?.focus();
    }
  };

  const filteredSkills = suggestedSkills.filter(s => s.toLowerCase().includes(skillInput.toLowerCase()) && !formData.skills.includes(s));
  const toggleTask = (wIndex: number, tIndex: number) => setCheckedTasks(p => ({ ...p, [`${wIndex}-${tIndex}`]: !p[`${wIndex}-${tIndex}`] }));
  
  const downloadMarkdown = () => {
    if (!projectData) return;
    const md = `# ${projectData.project_title}
> ${projectData.one_line_pitch}

**Theme:** ${projectData.hackathon_theme}
**Innovation Factor:** ${projectData.innovation_factor}

## 🚀 Skill-Gap Target: ${projectData.skill_gap_tool_to_learn.name}
*${projectData.skill_gap_tool_to_learn.explanation}*

## Core Features
${projectData.core_features.map(f => `- ${f}`).join('\n')}

## Tech Stack
- **Frontend:** ${projectData.tech_stack.frontend.join(', ')}
- **Backend:** ${projectData.tech_stack.backend.join(', ')}
- **Database:** ${projectData.tech_stack.database.join(', ')}
- **AI Tools:** ${projectData.tech_stack.ai_tools.join(', ')}

## Architecture Diagram (Mermaid)
\`\`\`mermaid
${projectData.architecture_mermaid}
\`\`\`

## Deployment Guide
${projectData.deployment_guide.map((step, i) => `${i+1}. ${step}`).join('\n')}

## 📅 Roadmap
${projectData.four_week_roadmap.map(week => `
### Week ${week.week_number}: ${week.milestone_title}
${week.tasks.map(t => `- [ ] ${t}`).join('\n')}
`).join('')}
`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectData.project_title.replace(/\s+/g, '-').toLowerCase()}-blueprint.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printDashboard = () => { window.print(); };

  const LoadingOverlay = ({ text }: { text: string }) => (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500 backdrop-blur-md bg-white/70 dark:bg-zinc-900/60 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/60 shadow-xl print:hidden">
      <BrainCircuit className="w-20 h-20 text-accent-light mb-6 animate-pulse" />
      <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">YuktiSetu AI is thinking...</h2>
      <p className="text-gray-500 dark:text-zinc-400 text-lg min-h-[30px] transition-all duration-300">{text}</p>
    </div>
  );

  const renderContextualInfo = () => {
    if (step === 1) return (
      <div className="animate-in fade-in slide-in-from-bottom-4 mt-8 backdrop-blur-md bg-white/10 dark:bg-white/5 p-6 rounded-2xl border border-white/20 dark:border-white/10 shadow-lg">
        <h3 className="font-bold text-accent-light mb-2 flex items-center gap-2"><Target className="w-5 h-5"/> Domain Alignment</h3>
        <p className="text-zinc-100 dark:text-zinc-300 text-sm leading-relaxed">YuktiSetu uses your degree to calibrate project complexity. Pick a target domain that excites you—this will shape the real-world problem your project attempts to solve.</p>
      </div>
    );
    if (step === 2) return (
      <div className="animate-in fade-in slide-in-from-bottom-4 mt-8 backdrop-blur-md bg-white/10 dark:bg-white/5 p-6 rounded-2xl border border-white/20 dark:border-white/10 shadow-lg">
        <h3 className="font-bold text-accent-alt mb-2 flex items-center gap-2"><Cpu className="w-5 h-5"/> Skill Gap Analysis</h3>
        <p className="text-zinc-100 dark:text-zinc-300 text-sm leading-relaxed">List exactly what you know. We'll design an architecture that leverages these skills but intentionally pushes you to learn ONE new industry-trending tool.</p>
      </div>
    );
    if (step === 3) return (
      <div className="animate-in fade-in slide-in-from-bottom-4 mt-8 backdrop-blur-md bg-white/10 dark:bg-white/5 p-6 rounded-2xl border border-white/20 dark:border-white/10 shadow-lg">
        <h3 className="font-bold text-white mb-2 flex items-center gap-2"><Layers className="w-5 h-5"/> Scope Definition</h3>
        <p className="text-zinc-100 dark:text-zinc-300 text-sm leading-relaxed">A Hackathon project focuses on quick MVP features. A Capstone demands rigorous architecture, while a Startup MVP requires scalability and deployment viability.</p>
      </div>
    );
    return null;
  };

  return (
    <div className="bg-zinc-50 dark:bg-zinc-950 text-gray-900 dark:text-white font-sans transition-colors duration-300 print:bg-white print:text-black">
      
      {/* Ambient Background Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 print:hidden overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-gradient-to-r from-blue-600/20 via-indigo-500/20 to-purple-600/20 blur-3xl opacity-50 dark:opacity-30 mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-gradient-to-l from-blue-600/20 via-indigo-500/20 to-purple-600/20 blur-3xl opacity-50 dark:opacity-30 mix-blend-multiply dark:mix-blend-screen" />
      </div>

      <div className="absolute top-0 right-0 p-6 z-50 flex gap-4 print:hidden">
        <button 
          onClick={() => setIsDark(!isDark)}
          className="p-3 backdrop-blur-md bg-white/70 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800/60 text-gray-700 dark:text-white rounded-full shadow-xl hover:scale-105 transition-all"
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          aria-label="Toggle Theme"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <a
        href="https://github.com/lumenkanishk"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 px-4 py-2 backdrop-blur-md bg-white/70 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800/60 rounded-full shadow-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-sm font-medium text-gray-700 dark:text-zinc-300 print:hidden"
        aria-label="Creator Github Profile"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.5 6-6.5a5.5 5.5 0 0 0-1.5-3.8 5.5 5.5 0 0 0-.1-3.8s-1.3-.4-4 1.4a13.3 13.3 0 0 0-7 0c-2.7-1.8-4-1.4-4-1.4a5.5 5.5 0 0 0-.1 3.8A5.5 5.5 0 0 0 2 12.5c0 5 3 6.2 6 6.5a4.8 4.8 0 0 0-1 3.2v4"/><path d="M9 18c-4.5 1.6-5-2-7-2"/></svg>
        Created by Kanishk
      </a>

      {step === 0 ? (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 relative z-10">
          <div className="max-w-4xl text-center backdrop-blur-md bg-white/50 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/60 p-12 rounded-3xl shadow-2xl">
            <BrainCircuit className="w-20 h-20 text-accent-light mx-auto mb-6 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
            <h1 className="text-5xl md:text-7xl font-black mb-6 uppercase tracking-tight">YuktiSetu</h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-zinc-400 max-w-3xl mx-auto mb-12 leading-relaxed">
              An AI-powered platform to generate final-year project ideas, matching your skills with industry gaps, and providing end-to-end development roadmaps.
            </p>
            <button onClick={() => setStep(1)} className="px-10 py-4 bg-accent-light text-white font-black text-xl rounded-full shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300">
              Get Started
            </button>
          </div>
        </div>
      ) : step === 5 ? (
        <div className="min-h-screen flex flex-col p-4 md:p-10 max-w-7xl mx-auto relative z-10">
          {isGeneratingRoadmap ? <LoadingOverlay text={loadingTexts[loadingIndex]} /> : projectData ? (
            <div className="animate-in fade-in slide-in-from-bottom-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 print:hidden">
                <button onClick={() => setStep(4)} className="flex items-center gap-2 text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors backdrop-blur-sm bg-white/50 dark:bg-zinc-900/50 px-4 py-2 rounded-xl border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm" aria-label="Go back">
                  <ChevronLeft className="w-4 h-4" /> Back to Ideas
                </button>
                <div className="flex gap-3">
                  <button onClick={printDashboard} className="flex items-center gap-2 px-4 py-2 backdrop-blur-md bg-white/70 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-gray-900 dark:text-white rounded-xl shadow-lg transition-all" aria-label="Print dashboard">
                    <Printer className="w-4 h-4" /> Print
                  </button>
                  <button onClick={downloadMarkdown} className="flex items-center gap-2 px-5 py-2 bg-accent-light text-white rounded-xl font-bold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300" aria-label="Download Blueprint">
                    <Download className="w-4 h-4" /> Export Blueprint
                  </button>
                </div>
              </div>

              <div className="backdrop-blur-md bg-white/70 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800/60 shadow-xl print:bg-white print:text-black print:border-zinc-300 print:shadow-none rounded-3xl p-8 md:p-12 mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 print:hidden">
                  <Rocket className="w-64 h-64 text-accent-light" />
                </div>
                <div className="relative z-10 max-w-4xl">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-light/10 border border-accent-light/20 text-accent-light text-xs font-black uppercase tracking-widest mb-6 print:bg-transparent print:border-none print:px-0">
                    <Target className="w-4 h-4 print:hidden" /> {projectData.hackathon_theme}
                  </div>
                  <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white print:text-black mb-6 leading-tight">
                    {projectData.project_title}
                  </h1>
                  <p className="text-xl md:text-2xl text-gray-600 dark:text-zinc-400 print:text-gray-800 font-medium leading-relaxed">
                    {projectData.one_line_pitch}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="backdrop-blur-md bg-white/70 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800/60 shadow-xl print:bg-white print:text-black print:border-zinc-300 print:shadow-none rounded-3xl p-8">
                  <div className="flex items-center gap-3 text-accent-alt mb-4">
                    <Zap className="w-6 h-6 print:hidden" />
                    <h3 className="text-xl font-black uppercase tracking-wide">Innovation Factor</h3>
                  </div>
                  <p className="text-gray-800 dark:text-zinc-200 print:text-black text-lg leading-relaxed">{projectData.innovation_factor}</p>
                </div>

                <div className="backdrop-blur-md bg-white/70 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800/60 shadow-xl print:bg-white print:text-black print:border-zinc-300 print:shadow-none rounded-3xl p-8 relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-br from-accent-light/5 to-transparent pointer-events-none print:hidden"/>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 text-accent-light mb-4">
                      <Cpu className="w-6 h-6 print:hidden" />
                      <h3 className="text-xl font-black uppercase tracking-wide">Skill-Gap Target</h3>
                    </div>
                    <div className="inline-block px-4 py-2 bg-accent-light text-white print:bg-transparent print:text-black print:border print:border-gray-300 font-black rounded-lg mb-4 text-xl shadow-[0_0_20px_rgba(59,130,246,0.3)] print:shadow-none">
                      {projectData.skill_gap_tool_to_learn.name}
                    </div>
                    <p className="text-gray-800 dark:text-zinc-200 print:text-black text-lg leading-relaxed">{projectData.skill_gap_tool_to_learn.explanation}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-2 backdrop-blur-md bg-white/70 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800/60 shadow-xl print:bg-white print:text-black print:border-zinc-300 print:shadow-none rounded-3xl p-8">
                  <h3 className="flex items-center gap-3 text-xl font-black text-gray-900 dark:text-white print:text-black mb-6 uppercase">
                    <Layers className="w-6 h-6 text-accent-light print:hidden" /> System Architecture
                  </h3>
                  <div className="bg-white dark:bg-zinc-950/50 rounded-2xl p-6 border border-zinc-200/50 dark:border-zinc-800/50 overflow-x-auto print:border-none print:p-0">
                    <MermaidDiagram chart={projectData.architecture_mermaid} isDark={isDark} />
                  </div>
                </div>

                <div className="backdrop-blur-md bg-white/70 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800/60 shadow-xl print:bg-white print:text-black print:border-zinc-300 print:shadow-none rounded-3xl p-8">
                  <h3 className="flex items-center gap-3 text-xl font-black text-gray-900 dark:text-white print:text-black mb-6 uppercase">
                    <Code2 className="w-6 h-6 text-accent-light print:hidden" /> Tech Stack
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-gray-500 dark:text-zinc-400 print:text-black text-sm font-bold uppercase mb-3 flex items-center gap-2"><Terminal className="w-4 h-4 print:hidden" /> Frontend</h4>
                      <div className="flex flex-wrap gap-2">
                        {projectData.tech_stack.frontend.map((t,i) => <span key={i} className="px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700/50 rounded-lg text-sm text-gray-800 dark:text-zinc-200 print:border-zinc-300">{t}</span>)}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-gray-500 dark:text-zinc-400 print:text-black text-sm font-bold uppercase mb-3 flex items-center gap-2"><Server className="w-4 h-4 print:hidden" /> Backend</h4>
                      <div className="flex flex-wrap gap-2">
                        {projectData.tech_stack.backend.map((t,i) => <span key={i} className="px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700/50 rounded-lg text-sm text-gray-800 dark:text-zinc-200 print:border-zinc-300">{t}</span>)}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-gray-500 dark:text-zinc-400 print:text-black text-sm font-bold uppercase mb-3 flex items-center gap-2"><Code2 className="w-4 h-4 print:hidden" /> Database</h4>
                      <div className="flex flex-wrap gap-2">
                        {projectData.tech_stack.database.map((t,i) => <span key={i} className="px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700/50 rounded-lg text-sm text-gray-800 dark:text-zinc-200 print:border-zinc-300">{t}</span>)}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-accent-alt text-sm font-bold uppercase mb-3 flex items-center gap-2"><BrainCircuit className="w-4 h-4 print:hidden" /> AI Tools</h4>
                      <div className="flex flex-wrap gap-2">
                        {projectData.tech_stack.ai_tools.map((t,i) => <span key={i} className="px-3 py-1.5 bg-accent-alt/10 border border-accent-alt/30 text-accent-alt rounded-lg text-sm font-bold print:border-zinc-300 print:text-black">{t}</span>)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 backdrop-blur-md bg-white/70 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800/60 shadow-xl print:bg-white print:text-black print:border-zinc-300 print:shadow-none rounded-3xl p-8">
                  <h3 className="flex items-center gap-3 text-xl font-black text-gray-900 dark:text-white print:text-black mb-6 uppercase">
                    <Map className="w-6 h-6 text-accent-light print:hidden" /> Execution Roadmap
                  </h3>
                  <div className="space-y-6">
                    {projectData.four_week_roadmap.map((week, wIndex) => (
                      <div key={wIndex} className="bg-white dark:bg-zinc-950/50 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 print:border-none print:p-0 print:mb-4">
                        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-zinc-200/50 dark:border-zinc-800/50 print:border-b-2 print:border-black">
                          <span className="bg-accent-light text-white px-3 py-1.5 rounded-lg font-black print:bg-transparent print:text-black print:border print:border-gray-300">W{week.week_number}</span>
                          <h4 className="text-gray-900 dark:text-white print:text-black text-lg font-bold">{week.milestone_title}</h4>
                        </div>
                        <ul className="space-y-3">
                          {week.tasks.map((task, tIndex) => {
                            const isChecked = checkedTasks[`${wIndex}-${tIndex}`];
                            return (
                              <li key={tIndex} className="flex gap-3 group cursor-pointer print:break-inside-avoid" onClick={() => toggleTask(wIndex, tIndex)}>
                                <button className="text-zinc-400 dark:text-zinc-600 hover:text-accent-light mt-0.5 shrink-0 transition-colors print:text-black" aria-label={`Toggle task: ${task}`}>
                                  {isChecked ? <CheckSquare className="w-5 h-5 text-accent-light print:text-black" /> : <Square className="w-5 h-5" />}
                                </button>
                                <span className={`text-gray-600 dark:text-zinc-400 print:text-black group-hover:text-gray-900 dark:group-hover:text-white transition-colors leading-relaxed ${isChecked ? 'line-through opacity-50' : ''}`}>
                                  {task}
                                </span>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="backdrop-blur-md bg-white/70 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800/60 shadow-xl print:bg-white print:text-black print:border-zinc-300 print:shadow-none rounded-3xl p-8 h-fit">
                  <h3 className="flex items-center gap-3 text-xl font-black text-gray-900 dark:text-white print:text-black mb-6 uppercase">
                    <Cloud className="w-6 h-6 text-accent-light print:hidden" /> Deployment Guide
                  </h3>
                  <ol className="space-y-6">
                    {projectData.deployment_guide.map((step, i) => (
                      <li key={i} className="flex gap-4 print:break-inside-avoid">
                        <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700/60 text-gray-500 dark:text-zinc-400 print:text-black print:border-black flex items-center justify-center shrink-0 font-bold">{i + 1}</div>
                        <p className="text-gray-800 dark:text-zinc-200 print:text-black text-sm leading-relaxed pt-1">{step}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <DoubtSolver projectContext={projectData} />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="min-h-screen flex flex-col lg:flex-row relative z-10">
          <div className="lg:w-1/2 p-8 lg:p-16 bg-zinc-900 text-white flex flex-col justify-center border-r border-zinc-800">
            <h1 className="text-4xl font-black mb-6">Build projects that matter.</h1>
            {renderContextualInfo()}
          </div>
          <div className="lg:w-1/2 p-6 lg:p-12 flex justify-center items-center">
            <div className="w-full max-w-lg pb-32">
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-3 shadow-lg">
                  <X className="w-5 h-5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}
              {step === 1 && (
                <div className="animate-in fade-in slide-in-from-right-4 backdrop-blur-md bg-white/70 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800/60 shadow-xl rounded-3xl p-8">
                  <h3 className="text-2xl font-black mb-6 flex items-center gap-2"><GraduationCap className="w-6 h-6 text-accent-light"/> Academic Details</h3>
                  <input type="text" placeholder="Major (e.g. Computer Science)" aria-label="College Major" className="w-full mb-4 bg-white dark:bg-zinc-950/50 border border-zinc-300 dark:border-zinc-700/60 rounded-xl px-5 py-4 focus:border-accent-light outline-none shadow-inner" value={formData.major} onChange={e => setFormData({...formData, major: e.target.value})} />
                  <select aria-label="Target Domain" className="w-full bg-white dark:bg-zinc-950/50 border border-zinc-300 dark:border-zinc-700/60 rounded-xl px-5 py-4 focus:border-accent-light outline-none shadow-inner" value={formData.domain} onChange={e => setFormData({...formData, domain: e.target.value})}>
                    <option value="" disabled>Select Domain</option>
                    {domains.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              )}

              {step === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4 backdrop-blur-md bg-white/70 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800/60 shadow-xl rounded-3xl p-8">
                  <h3 className="text-2xl font-black mb-6 flex items-center gap-2"><Code2 className="w-6 h-6 text-accent-light"/> Skills</h3>
                  <div className="relative" ref={dropdownRef}>
                    <input 
                      type="text" placeholder="e.g. React..." aria-label="Add technical skill"
                      className="w-full bg-white dark:bg-zinc-950/50 border border-zinc-300 dark:border-zinc-700/60 rounded-xl px-5 py-4 focus:border-accent-light outline-none shadow-inner"
                      value={skillInput} onChange={e => {setSkillInput(e.target.value); setShowSkillDropdown(true)}} onFocus={() => setShowSkillDropdown(true)} onKeyDown={handleKeyDownDropdown}
                    />
                    <button onClick={() => addSkill(skillInput)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-zinc-200 dark:bg-zinc-800 text-accent-light rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors" aria-label="Add skill">
                      <Plus className="w-4 h-4" />
                    </button>
                    {showSkillDropdown && filteredSkills.length > 0 && (
                      <div className="absolute w-full mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/60 rounded-xl shadow-2xl z-[60] max-h-56 overflow-y-auto">
                        {filteredSkills.map(skill => (
                          <div key={skill} className="px-5 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer text-gray-800 dark:text-zinc-200" onClick={() => addSkill(skill)}>{skill}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-6">
                    {formData.skills.map((skill, index) => (
                      <div key={skill} onClick={() => setFormData({...formData, skills: formData.skills.filter(s => s !== skill)})} className={`px-4 py-2 rounded-xl text-sm font-bold border cursor-pointer hover:!bg-red-500/10 hover:!text-red-500 hover:!border-red-500/50 shadow-sm transition-colors ${tagColors[index%3]}`}>
                        {skill} <X className="w-3 h-3 inline ml-1"/>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="animate-in fade-in slide-in-from-right-4 backdrop-blur-md bg-white/70 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800/60 shadow-xl rounded-3xl p-8">
                  <h3 className="text-2xl font-black mb-6 flex items-center gap-2"><Layers className="w-6 h-6 text-accent-light"/> Constraints</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <input type="number" placeholder="Team Size (1-4)" aria-label="Team Size" className="w-full bg-white dark:bg-zinc-950/50 border border-zinc-300 dark:border-zinc-700/60 rounded-xl px-5 py-4 outline-none focus:border-accent-light shadow-inner" value={formData.teamSize} onChange={e => setFormData({...formData, teamSize: parseInt(e.target.value) || ''})} />
                    <input type="number" placeholder="Weeks (1-24)" aria-label="Project Duration in weeks" className="w-full bg-white dark:bg-zinc-950/50 border border-zinc-300 dark:border-zinc-700/60 rounded-xl px-5 py-4 outline-none focus:border-accent-light shadow-inner" value={formData.duration} onChange={e => setFormData({...formData, duration: parseInt(e.target.value) || ''})} />
                  </div>
                  <select aria-label="Project Level" className="w-full bg-white dark:bg-zinc-950/50 border border-zinc-300 dark:border-zinc-700/60 rounded-xl px-5 py-4 outline-none focus:border-accent-light shadow-inner" value={formData.projectType} onChange={e => setFormData({...formData, projectType: e.target.value})}>
                    <option value="" disabled>Select Level</option>
                    {targetLevels.map(lvl => <option key={lvl}>{lvl}</option>)}
                  </select>
                </div>
              )}

              {step === 4 && (
                <div className="animate-in fade-in slide-in-from-right-4">
                  <h2 className="text-3xl font-black mb-8 flex items-center gap-3"><Lightbulb className="w-8 h-8 text-accent-light"/> Select Concept</h2>
                  {isGenerating ? <LoadingOverlay text={loadingTexts[loadingIndex]} /> : ideas?.map((idea, i) => (
                    <div key={i} onClick={() => generateRoadmap(idea)} className="backdrop-blur-md bg-white/70 dark:bg-zinc-900/60 p-6 rounded-2xl mb-4 cursor-pointer hover:border-accent-light border border-zinc-200/50 dark:border-zinc-800/60 shadow-lg hover:shadow-xl hover:shadow-blue-500/10 transition-all group">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-lg group-hover:text-accent-light transition-colors">{idea.title}</h3>
                        <div className="flex items-center gap-1 bg-white dark:bg-zinc-950/50 px-2.5 py-1 rounded-md text-xs font-bold text-gray-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60">
                          <Target className="w-3 h-3" /> {idea.feasibility_score}/10
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">{idea.pitch}</p>
                    </div>
                  ))}
                </div>
              )}

              {step < 4 && (
                <div className="flex justify-between mt-8 relative z-10">
                  <button onClick={handleBack} className={`px-6 py-3 font-bold text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors ${step === 1 ? 'invisible' : ''}`} aria-label="Go back to previous step">Back</button>
                  <button onClick={step < 3 ? handleNext : handleSubmit} className="flex items-center gap-2 px-8 py-3 bg-accent-light text-white font-black rounded-xl hover:-translate-y-0.5 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300">
                    {step < 3 ? 'Next' : 'Generate'} <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
