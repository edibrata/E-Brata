const fs = require('fs');
let code = fs.readFileSync('src/components/KriteriaKetuntasan.tsx', 'utf8');

code = code.replace(
  /Nilai di atas batas kuning \(&gt;\{tempIntervals\[2\]\}\) dianggap <b>TUNTAS<\/b>.\s*<\/p>\s*<\/div>\s*<\/div>\s*<\/div>/,
  `Nilai di atas batas kuning (&gt;{tempIntervals[2]}) dianggap <b>TUNTAS</b>.\n                </p>\n                <p className="mt-3 text-indigo-700 font-semibold">\n                  👉 <span className="cursor-pointer hover:underline" onClick={() => { const btn = document.querySelector('[aria-label="Panduan Asesmen 2025"]') || document.evaluate('//button[contains(., "Panduan Asesmen 2025")]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue; if(btn) btn.click(); }}>Baca penjelasan lengkap tentang Panduan Penilaian 2025 di sini.</span>\n                </p>\n              </div>\n            </div>\n          </div>`
);

fs.writeFileSync('src/components/KriteriaKetuntasan.tsx', code);
