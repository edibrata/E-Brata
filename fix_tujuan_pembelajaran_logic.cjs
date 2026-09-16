const fs = require('fs');
let code = fs.readFileSync('src/views/TujuanPembelajaran.tsx', 'utf8');

// I noticed the button already has onClick={handleGenerateDefaultTp}.
// Let's modify the fuzzy parsing logic to be absolutely bulletproof.
const newGenerateLogic = `  const handleGenerateDefaultTp = () => {
    if (!selectedMapel) return;
    const mapelObj = mapel.find(m => m.id === selectedMapel);
    if (!mapelObj) return;

    if (!mapelObj.nama.toLowerCase().includes('pancasila')) {
      alert("Maaf, muat TP otomatis saat ini baru tersedia untuk mata pelajaran Pendidikan Pancasila.");
      return;
    }

    const { kelas, semester } = state.sekolah;
    
    let sem = "1";
    if (String(semester).toLowerCase().includes('genap') || String(semester).includes('2')) {
      sem = "2";
    }

    let parsedKelas = String(kelas).replace(/[^0-9]/g, '');
    
    // Fallback if roman numerals or words are used
    const kelasStr = String(kelas).toLowerCase();
    if (!parsedKelas) {
      if (kelasStr.includes('satu') || kelasStr.includes('i') && !kelasStr.includes('ii') && !kelasStr.includes('iii') && !kelasStr.includes('iv') && !kelasStr.includes('vi') && !kelasStr.includes('ix')) parsedKelas = '1';
      else if (kelasStr.includes('dua') || kelasStr.includes('ii') && !kelasStr.includes('iii') && !kelasStr.includes('vii') && !kelasStr.includes('viii')) parsedKelas = '2';
      else if (kelasStr.includes('tiga') || kelasStr.includes('iii') && !kelasStr.includes('viii')) parsedKelas = '3';
      else if (kelasStr.includes('empat') || kelasStr.includes('iv')) parsedKelas = '4';
      else if (kelasStr.includes('lima') || kelasStr.includes('v') && !kelasStr.includes('iv') && !kelasStr.includes('vi') && !kelasStr.includes('vii') && !kelasStr.includes('viii')) parsedKelas = '5';
      else if (kelasStr.includes('enam') || kelasStr.includes('vi') && !kelasStr.includes('vii') && !kelasStr.includes('viii')) parsedKelas = '6';
      else if (kelasStr.includes('tujuh') || kelasStr.includes('vii') && !kelasStr.includes('viii')) parsedKelas = '7';
      else if (kelasStr.includes('delapan') || kelasStr.includes('viii')) parsedKelas = '8';
      else if (kelasStr.includes('sembilan') || kelasStr.includes('ix')) parsedKelas = '9';
      else if (kelasStr.includes('sepuluh') || kelasStr.includes('x') && !kelasStr.includes('xi') && !kelasStr.includes('xii')) parsedKelas = '10';
      else if (kelasStr.includes('sebelas') || kelasStr.includes('xi') && !kelasStr.includes('xii')) parsedKelas = '11';
      else if (kelasStr.includes('dua belas') || kelasStr.includes('xii')) parsedKelas = '12';
    }

    if (!parsedKelas) {
      alert("Sistem tidak dapat mendeteksi pengaturan angka Kelas. Silakan periksa kembali isian di menu Data Dasar -> Profil Sekolah.");
      return;
    }

    const kelasData = defaultTpPancasila[parsedKelas];
    if (!kelasData) {
      alert(\`Maaf, data TP default untuk Kelas \${parsedKelas} belum tersedia di sistem.\`);
      return;
    }

    const tpsToInject = kelasData[sem];
    if (!tpsToInject || tpsToInject.length === 0) {
      alert(\`Maaf, data TP default untuk Kelas \${parsedKelas} Semester \${sem} belum tersedia di sistem.\`);
      return;
    }

    if (window.confirm(\`Apakah Anda yakin ingin memuat \${tpsToInject.length} TP default Pendidikan Pancasila untuk Kelas \${parsedKelas} Semester \${sem}?\`)) {
      let indexCounter = 0;
      const newTps = tpsToInject.map(item => ({
        id: 'tp_' + Date.now() + '_' + (indexCounter++),
        mapelId: selectedMapel,
        kode: item.kode,
        deskripsi: item.deskripsi
      }));

      updateState('tujuanPembelajaran', [...state.tujuanPembelajaran, ...newTps]);
    }
  };

  const handleDownloadTemplate = () => {`;

code = code.replace(/const handleGenerateDefaultTp = \(\) => \{[\s\S]*?const handleDownloadTemplate = \(\) => \{/, newGenerateLogic);

fs.writeFileSync('src/views/TujuanPembelajaran.tsx', code);
