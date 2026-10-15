/**
 * Tabby's Diary, Run Notes, and Branching Endings Engine
 * Preserves permanent lore progress across loops and tracks branching ending trees.
 */

export interface DiaryEntry {
  id: string;
  title: string;
  quote: string;
  loreAr?: string;
  isEndingRecord?: boolean;
  endingNumber?: 1 | 2 | 3;
  date?: string;
}

export interface RunNote {
  id: string;
  text: string;
  subtextAr?: string;
  timestamp: number;
}

export interface EndingNode {
  id: 'ending_1' | 'ending_2' | 'ending_3';
  number: 1 | 2 | 3;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  descriptionAr: string;
  requirementAr: string;
  prerequisites: ('ending_1' | 'ending_2')[];
  isUnlocked: boolean;
  isCompleted: boolean;
  completedAt?: number;
}

export interface StoredDiaryData {
  completedEndings: Record<string, { completedAt: number; loopCount: number }>;
  pendingEnding2RespawnWrite?: boolean;
  unlockedEntries: string[];
}

const STORAGE_KEY = 'the_haunted_house_tabby_diary_v1';

// Base initial permanent diary entries (always present in the diary)
export const INITIAL_DIARY_ENTRIES: DiaryEntry[] = [
  {
    id: 'entry_freedom',
    title: 'أمل الحرية (The Hope)',
    quote: "Tabby:the freedom,away from the isolating,that's I hope",
    loreAr: 'همسات تابي في صمت غرفتها المظلمة؛ تتطلع إلى كسر العزلة وفتح الأبواب الموصدة.',
    endingNumber: 1,
  },
  {
    id: 'entry_confront_fears',
    title: 'مواجهة المخاوف (Confront Fears)',
    quote: "For years I've been afraid of this house. Should I confront my fears or just live with them?",
    loreAr: 'تساؤل تابي الدفين حول الوحوش والكوابيس التي استوطنت زوايا هذا البيت لسنوات طويلة.',
    endingNumber: 2,
  },
];

// Load persisted diary and endings state from localStorage
export function loadDiaryState(): StoredDiaryData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        completedEndings: parsed.completedEndings || {},
        pendingEnding2RespawnWrite: parsed.pendingEnding2RespawnWrite || false,
        unlockedEntries: parsed.unlockedEntries || [],
      };
    }
  } catch (err) {
    console.error('Failed to load diary state from localStorage:', err);
  }
  return {
    completedEndings: {},
    pendingEnding2RespawnWrite: false,
    unlockedEntries: [],
  };
}

// Save persisted state to localStorage
export function saveDiaryState(data: StoredDiaryData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save diary state to localStorage:', err);
  }
}

// Get the computed list of diary entries (base entries + completed ending writes)
export function getActiveDiaryEntries(stored: StoredDiaryData): DiaryEntry[] {
  const entries: DiaryEntry[] = [...INITIAL_DIARY_ENTRIES];

  // If Ending 1 is completed, Tabby writes her achievement in the diary:
  if (stored.completedEndings['ending_1']) {
    const rec = stored.completedEndings['ending_1'];
    entries.push({
      id: 'entry_ending_1_completed',
      title: 'إنجاز النهاية الأولى: الخروج إلى النور (Ending 1: Escaped)',
      quote: "Tabby: I finally broke the barricaded exit with the fire axe and stepped into the open air. The house is behind me now... I am free.",
      loreAr: `تم إكمال النهاية الأولى بنجاح في الحلقة #${rec.loopCount}. حطمت تابي ألواح الباب الخارجي وخرجت نحو الفجر.`,
      isEndingRecord: true,
      endingNumber: 1,
      date: new Date(rec.completedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    });
  }

  // If Ending 2 is completed AND written (after respawning in a new run):
  if (stored.completedEndings['ending_2'] && !stored.pendingEnding2RespawnWrite) {
    const rec = stored.completedEndings['ending_2'];
    entries.push({
      id: 'entry_ending_2_completed',
      title: 'إنجاز النهاية الثانية: قتل الوحوش (Ending 2: Monsters Defeated)',
      quote: "Tabby: I stood my ground and aimed true with my slingshot. Both shadow creatures were destroyed. My courage defeated the terror.",
      loreAr: `تم إكمال النهاية الثانية بنجاح في الحلقة #${rec.loopCount}. واجهت تابي أعتى مخاوفها وأبادت وحشي المنزل بأداة المنبل.`,
      isEndingRecord: true,
      endingNumber: 2,
      date: new Date(rec.completedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    });
  }

  return entries;
}

// Compute the Branching Tree for the 3 Endings
export function getEndingsTree(stored: StoredDiaryData): EndingNode[] {
  const isE1Done = !!stored.completedEndings['ending_1'];
  const isE2Done = !!stored.completedEndings['ending_2'];
  const isE3Done = !!stored.completedEndings['ending_3'];

  // Ending 1: Always unlocked from the start
  const ending1: EndingNode = {
    id: 'ending_1',
    number: 1,
    titleAr: 'النهاية الأولى: الخروج',
    titleEn: 'The Freedom',
    subtitleAr: 'الهروب من المنزل المسكون',
    descriptionAr: 'العثور على فأس الحريق من غرفة نوم الوالدين وتحطيم ألواح وسلاسل الباب الخارجي في الصالة الدائرية والهروب نحو الفجر.',
    requirementAr: 'تحطيم سلاسل وألواح الباب الخارجي (Front Door) والخروج منه.',
    prerequisites: [],
    isUnlocked: true,
    isCompleted: isE1Done,
    completedAt: stored.completedEndings['ending_1']?.completedAt,
  };

  // Ending 2: Can be completed directly without Ending 1 ("تقدر تعملها من غير النهاية الأولي")
  const ending2: EndingNode = {
    id: 'ending_2',
    number: 2,
    titleAr: 'النهاية الثانية: قتل الوحوش',
    titleEn: 'Confront Fears',
    subtitleAr: 'صيادة الكوابيس وأداة المنبل',
    descriptionAr: 'العثور على أداة المنبل (النبالة الخشبية) في المطبخ ومواجهة وحش غرفة المعيشة ووحش السقيفة والقضاء عليهما بحصوات المنبل.',
    requirementAr: 'قتل الوحشين (The Stalker و Attic Specter) باستخدام أداة المنبل.',
    prerequisites: [],
    isUnlocked: true,
    isCompleted: isE2Done,
    completedAt: stored.completedEndings['ending_2']?.completedAt,
  };

  // Ending 3: Branching ending - Locked until Ending 1 OR Ending 2 is completed!
  // "النهايات بتكون بنظام شبه نظام متفرع يعني بعض النهايات مش هقدر تفتحها الا بعد نهايات أخري"
  const isE3Unlocked = isE1Done || isE2Done;
  const ending3: EndingNode = {
    id: 'ending_3',
    number: 3,
    titleAr: 'النهاية الثالثة: سر القبو الدفين',
    titleEn: 'The Cellar Secret',
    subtitleAr: 'المسار المتفرع لكشف الحقيقة',
    descriptionAr: 'مسار فرعي يتشعب بعد كسر قيود المنزل أو مواجهة الوحوش؛ ينفتح باب القبو الدفين لكشف جذور اللعنة.',
    requirementAr: 'تتطلب إكمال النهاية الأولى (الخروج) أو النهاية الثانية (قتل الوحوش) أولاً لفك قفل هذا المسار.',
    prerequisites: ['ending_1', 'ending_2'],
    isUnlocked: isE3Unlocked,
    isCompleted: isE3Done,
    completedAt: stored.completedEndings['ending_3']?.completedAt,
  };

  return [ending1, ending2, ending3];
}
