/**
 * Game Guide & Mechanics Modal
 */
import { X, Shield, Clock, Flame, Ghost, Smartphone, Keyboard, ArrowDownToLine } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 text-slate-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Ghost className="w-5 h-5 text-rose-400" />
            <h2 className="text-base font-pixel text-amber-300">قواعد البقاء في المنزل</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4 text-xs leading-relaxed">
          {/* Concept */}
          <div className="p-3 bg-slate-850 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-amber-400">
              <Clock className="w-4 h-4" />
              <span>الحلقة الزمنية (Time Loop)</span>
            </div>
            <p className="text-slate-300 text-[11px]">
              تبدأ كل ليلة في سريرك عند الساعة <strong className="text-amber-300">11:50 PM</strong>. كل 25 ثانية تمر في الواقع تمثل دقيقتين في اللعبة. عند حلول منتصف الليل (12:00 AM)، يستيقظ المنزل بالكامل وتزداد شراسة الوحوش. إذا سقطت، ستستيقظ فوراً في سريرك مع بدء دورة جديدة!
            </p>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Mobile Touch */}
            <div className="p-3 bg-slate-850 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-cyan-400">
                <Smartphone className="w-4 h-4" />
                <span>تحكم الهاتف (اللمس المعزز)</span>
              </div>
              <ul className="space-y-1 text-[11px] text-slate-300">
                <li>• <strong>الإبهام / Joystick</strong>: حركة سلسة 360 درجة.</li>
                <li>• <strong>تفاعل [E]</strong>: فتح الأبواب والتقاط العناصر على الأرض.</li>
                <li>• <strong>إلقاء [Drop]</strong>: زر إلقاء مخصص + سحب لأسفل أو ضغط مطول على العنصر!</li>
                <li>• <strong>استخدام [F]</strong>: تفعيل الأداة المختارة (ملح، نبالة، عناق الدب).</li>
                <li>• <strong>المصباح</strong>: تشغيل/إطفاء الضوء لطرد وحش الظل.</li>
                <li>• <strong>اختباء</strong>: القفز تحت السرير، خلف الكنبة، أو داخل البانيو!</li>
              </ul>
            </div>

            {/* Desktop Keyboard */}
            <div className="p-3 bg-slate-850 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-purple-400">
                <Keyboard className="w-4 h-4" />
                <span>لوحة المفاتيح (كمبيوتر)</span>
              </div>
              <ul className="space-y-1 text-[11px] text-slate-300">
                <li>• <strong>WASD أو الأسهم</strong>: الحركة واستكشاف الغرف.</li>
                <li>• <strong>E</strong>: التفاعل مع الأثاث والتقاط العناصر الملقاة.</li>
                <li>• <strong>Q / G</strong>: إلقاء العنصر المختار على الأرض عند امتلاء الحقيبة.</li>
                <li>• <strong>F</strong>: استخدام العنصر النشط.</li>
                <li>• <strong>Space</strong>: المصباح اليدوي.</li>
                <li>• <strong>H</strong>: الاختباء / الخروج من المخبأ.</li>
                <li>• <strong>Shift</strong>: الركض السريع.</li>
                <li>• <strong>1 - 5</strong>: اختيار الأداة من شريط الحقيبة.</li>
              </ul>
            </div>
          </div>

          {/* New Item Drop Mechanics */}
          <div className="p-3 bg-slate-850 rounded-xl border border-amber-500/30 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-amber-300">
              <ArrowDownToLine className="w-4 h-4 text-amber-400" />
              <span>نظام إلقاء العناصر عند امتلاء الحقيبة</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              الحقيبة تتسع لـ 5 عناصر كحد أقصى. إذا امتلأت، يمكنك إلقاء أي عنصر على أرضية الغرفة بأكثر من طريقة:
              <br />
              1. <strong>الضغط المطول (Long Press)</strong> على العنصر في الشريط العلوي.
              <br />
              2. <strong>السحب لأسفل (Drag Down)</strong> من خانة العنصر.
              <br />
              3. النقر على زر <strong>الإلقاء السريع [إلقاء / Drop]</strong> بجانب الشريط أو في لوحة اللمس، أو مفتاح <strong>[Q / G]</strong>.
              <br />
              العناصر الملقاة تبقى في مكانها وتشع بريقاً ويمكنك العودة والتقاطها دائماً بالاقتراب والضغط على [E].
            </p>
          </div>

          {/* Survival Mechanics & Teddy Bear Tactical Use */}
          <div className="p-3 bg-slate-850 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-rose-400">
              <Shield className="w-4 h-4" />
              <span>أدوات البقاء وسر الدب المحشو 🧸</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
              <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                <span className="text-amber-300 font-bold">🧸 الدب المحشو (فائدة مزدوجة):</span>
                <p className="text-[10px] text-slate-400 mt-1">
                  • <strong>في يدك (استخدام F)</strong>: عناقه يهدئ دقات القلب المتسارعة فوراً ويحميك من الهلع.
                  <br />
                  • <strong>إلقاؤه على الأرض (Q / Drop)</strong>: طُعم تكتيكي مميز! تنجذب إليه الكيانات الفضولية وتنشغل بفحصه لعدة ثوانٍ مما يمنحك فرصة ذهبية للتسلل والهروب!
                </p>
              </div>
              <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                <span className="text-amber-300 font-bold">🔦 المصباح اليدوي:</span>
                <p className="text-[10px] text-slate-400 mt-1">
                  يسلط شعاع نور مركز يربك وحش الظلال (The Stalker) ويجبره على التراجع للوراء إذا واجهته مباشرة.
                </p>
              </div>
              <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                <span className="text-amber-300 font-bold">🧂 كيس الملح المبارك:</span>
                <p className="text-[10px] text-slate-400 mt-1">
                  اسكب خطاً على الأرض عند عتبات الأبواب لمنع الكيانات من الدخول أو ملاحقتك.
                </p>
              </div>
              <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                <span className="text-amber-300 font-bold">🎯 النبالة الخشبية:</span>
                <p className="text-[10px] text-slate-400 mt-1">
                  أطلق حجراً لإصابة الوحش وشل حركته مؤقتاً أو إحداث جلبة تشتته.
                </p>
              </div>
            </div>
          </div>

          {/* Key & Axe Door System */}
          <div className="p-3 bg-slate-850 rounded-xl border border-amber-500/30 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-amber-300">
              <span>🗝️ نظام البابين فقط وفأس الحريق الخارق 🪓</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              <strong>بابان اثنان فقط في كل المنزل يحتاجان إلى مفاتيح:</strong>
              <br />
              1. <strong className="text-amber-300">باب غرفة نوم الوالدين</strong>: يُفتح بالمفتاح النحاسي (الموجود في صينية طاولة الطعام بالمطبخ).
              <br />
              2. <strong className="text-amber-300">سلم العلية المظلمة</strong>: يُفتح بمفتاح العلية الحديدي (الموجود في درج تسريحة الوالدين).
              <br />
              🪓 <strong className="text-rose-400">فأس الحريق (The Fire Axe)</strong>:
              موجود داخل خزانة ملابس الوالدين الضخمة! بمجرد الحصول عليه، <strong>يكسر ويحطم جميع الأبواب والألواح المغلقة الأخرى فوراً</strong> (مثل باب القبو وباب الهروب الخارجي الرئيسي)، دون الحاجة لأي مفاتيح أخرى!
            </p>
          </div>

          {/* Torch & Candles System */}
          <div className="p-3 bg-slate-850 rounded-xl border border-orange-500/30 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-orange-300">
              <Flame className="w-4 h-4 text-orange-400" />
              <span>الشعلة المضيئة وإشعال الشموع 🕯️🔥</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              • <strong>الشعلة المضيئة</strong>: تجدينها في حامل حديدي بجانب مدفأة غرفة المعيشة.
              <br />
              • <strong>إشعال الشموع</strong>: اقتربي من أي شمعدان مطفأ في غرف المنزل (غرفة النوم، الممر، المطبخ، القبو) واضغطي [E/تفاعل] لإشعالها بالشعلة.
              <br />
              • <strong>فائدة الشموع المشتعلة</strong>: تضيء الغرفة بشكل دائم، تخفض دقات قلبك لتهدئة الهلع، وترعب الكيان المتربص وتمنعه من البقاء في الغرفة!
              <br />
              • <strong>التلويح بالشعلة [F]</strong>: يشتت ويرعب الوحوش المحيطة بكِ.
            </p>
          </div>

          {/* Flashlight Glitch-Fix & Emergency Crank */}
          <div className="p-3 bg-slate-850 rounded-xl border border-cyan-500/30 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-cyan-300">
              <span>🔦 حل مشكلة الكشاف: مقبض الشحن اليدوي التلقائي</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              • <strong>شحن الطوارئ اليدوي (Hand-Crank)</strong>: إذا نفدت البطارية بالكامل إلى 0% (خاصة بعد منتصف الليل)، ما عليكِ سوى الضغط على زر الكشاف؛ سيقوم مقبض الشحن اليدوي بشحن البطارية فوراً بنسبة +30% وإشعال الضوء!
              <br />
              • <strong>الشحن التلقائي الذاتي</strong>: عندما يكون الكشاف مطفأً، تستعيد البطارية شحنها ذاتياً ببطء.
            </p>
          </div>

          {/* New House Structure & Top Text Bar */}
          <div className="p-3 bg-slate-850 rounded-xl border border-purple-500/30 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-purple-300">
              <span>🏡 هيكل المنزل الجديد وشريط النصوص العلوي</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              • <strong>شريط النصوص العلوي الموحد</strong>: جميع نصوص التفاعل (React)، العثور على الأدوات، وتفاصيل استخدام الأدوات أو فحص الأبواب المقفلة والفارغة تظهر بخط صغير ومرتب في شريط النصوص العلوي فقط، مع إزالة أي نصوص مشتتة على الكانفاس.
              <br />
              • <strong>هيكل المنزل</strong>: تخرج من غرفة تابي لتقابل طرقة ممتدة فسيحة بها أبواب الغرف، وعند نهاية الطرقة تجد الصالة الدائرية العريضة رأسياً وبها باقي الأبواب (المعيشة، المطبخ، القبو، وباب الهروب الخارجي).
              <br />
              • <strong>لكل غرفة باب واحد فقط</strong>: تم إزالة جميع الأبواب المختصرة السابقة، وغرفة الوالدين فقط بداخلها باب يقود إلى العلية.
              <br />
              • <strong>المفاتيح والفأس</strong>: بابان فقط يحتاجان مفتاح؛ بداخل غرفة الوالدين تجد فأس الحريق الذي يكسر جميع الأبواب الأخرى المغلقة!
              <br />
              • <strong>عصا التحكم (Joystick)</strong>: مزاحة 5px إلى اليمين لراحة الإبهام أثناء اللعب.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-pixel text-xs rounded-xl shadow-lg transition-transform active:scale-95"
          >
            فهمت، لنبدأ اللعب!
          </button>
        </div>
      </div>
    </div>
  );
};
