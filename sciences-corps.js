/* Sciences de l'encyclopédie (13/11) : corps humain et système solaire. Même format que arbre-dieux.js :
   x en %, y en px ; to = [x, y] point visé par le trait (organe) ; orbit = orbite autour du Soleil ; color / size = disque coloré. */
window.ENC_SCI = {
  corps: {
    label: 'Corps humain', title: '🫀 Mon corps humain', color: '#0891b2', h: 720, bg: 'body', unknown: 'Partie du corps à découvrir',
    nodes: [
      { id: 'cerveau', name: 'Cerveau', emo: '🧠', x: 11, y: 50, to: [47, 46], q: [11062, 4157, 11212, 11213, 11217, 11220, 4740, 11218, 11219, 4156, 11283, 11214], desc: 'Il commande tout le corps grâce à ses milliards de neurones.' },
      { id: 'yeux', name: 'Yeux', emo: '👁️', x: 89, y: 50, to: [54, 58], q: [4155, 4319, 11015, 11114, 11167, 11216], desc: 'Ils captent la lumière et l’envoient au cerveau.' },
      { id: 'oreilles', name: 'Oreilles', emo: '👂', x: 11, y: 130, to: [42, 62], q: [161, 4738, 4786, 11103, 11282], desc: 'L’ouïe et l’équilibre.' },
      { id: 'bouche', name: 'Bouche et nez', emo: '👄', x: 89, y: 130, to: [51, 78], q: [4536, 11057, 11165, 11166, 11277, 11278, 11261, 4537], desc: 'Le goût, l’odorat, et le début de la digestion.' },
      { id: 'gorge', name: 'Gorge', emo: '🗣️', x: 11, y: 210, to: [50, 104], q: [11274, 11275, 11276], desc: 'Le passage de l’air et la voix.' },
      { id: 'coeur', name: 'Cœur', emo: '❤️', x: 89, y: 210, to: [55, 160], q: [11002, 675, 11172, 11173, 11300], desc: 'La pompe qui fait circuler le sang.' },
      { id: 'poumons', name: 'Poumons', emo: '🫁', x: 11, y: 290, to: [43, 158], q: [11004, 11111], desc: 'Ils apportent l’oxygène au sang.' },
      { id: 'sang', name: 'Sang', emo: '🩸', x: 89, y: 290, to: [70, 200], q: [1129, 2018, 4008, 11020, 11021, 11110, 11205, 11206, 11263, 11225], desc: 'Il transporte l’oxygène, la nourriture et les défenses du corps.' },
      { id: 'foie', name: 'Foie', emo: '🟫', x: 11, y: 370, to: [44, 205], q: [337, 11118], desc: 'Le plus lourd des organes internes.' },
      { id: 'pancreas', name: 'Pancréas', emo: '🧪', x: 89, y: 370, to: [55, 222], q: [2014, 11027, 11168], desc: 'Il fabrique l’insuline.' },
      { id: 'digestion', name: 'Estomac et intestins', emo: '🍽️', x: 11, y: 450, to: [50, 250], q: [11158, 11264, 11115, 11215, 11224], desc: 'Le long chemin des aliments.' },
      { id: 'rate', name: 'Rate', emo: '🛡️', x: 89, y: 450, to: [60, 205], q: [4320], desc: 'Elle filtre le sang et aide à combattre les infections.' },
      { id: 'reins', name: 'Reins', emo: '🫘', x: 11, y: 530, to: [45, 238], q: [11017], desc: 'Ils filtrent le sang et fabriquent l’urine.' },
      { id: 'peau', name: 'Peau', emo: '✋', x: 89, y: 530, to: [71, 310], q: [671, 11207, 11208, 11013, 11301, 11280], desc: 'Le plus grand organe du corps.' },
      { id: 'os', name: 'Squelette', emo: '🦴', x: 11, y: 610, to: [43, 470], q: [122, 361, 11011, 11038, 11159, 11160, 11161, 11162, 11211, 11262, 11221, 4690, 11281], desc: '206 os chez l’adulte.' },
      { id: 'muscles', name: 'Muscles', emo: '💪', x: 89, y: 610, to: [57, 430], q: [4589, 11163, 11164, 11209, 11210], desc: 'Ils font bouger le corps.' },
      { id: 'cellules', name: 'Cellules et ADN', emo: '🧬', x: 25, y: 688, q: [67, 393, 722, 732, 11019, 11286], desc: 'Les briques du vivant.' },
      { id: 'hormones', name: 'Hormones', emo: '⚗️', x: 50, y: 688, q: [662, 4255, 4739], desc: 'Les messagers chimiques du corps.' },
      { id: 'bebe', name: 'Bébé', emo: '👶', x: 75, y: 688, q: [11284, 11285, 11171], desc: 'Neuf mois avant la naissance.' }
    ]
  },
  espace: {
    label: 'Système solaire', title: '🪐 Mon système solaire', color: '#6d28d9', h: 820, bg: 'space', unknown: 'Astre à découvrir',
    nodes: [
      { id: 'soleil', name: 'Soleil', color: '#ffcf3a', size: 56, x: 50, y: 50, q: [11104, 11069, 11233, 120, 2021], desc: 'L’étoile au centre du système solaire.' },
      { id: 'mercure', name: 'Mercure', color: '#b0a8a0', size: 22, x: 32, y: 135, orbit: true, q: [], desc: 'La plus proche du Soleil.' },
      { id: 'venus', name: 'Vénus', color: '#e8c27a', size: 28, x: 68, y: 190, orbit: true, q: [1, 11294], desc: 'La planète la plus chaude.' },
      { id: 'terre', name: 'Terre', color: '#3d8bff', size: 30, x: 32, y: 250, orbit: true, q: [11007, 4159, 11185], desc: 'Notre planète bleue.' },
      { id: 'lune', name: 'Lune', color: '#d6d9e0', size: 18, x: 12, y: 300, q: [11005, 4734, 11269, 11119], desc: 'Le satellite naturel de la Terre.' },
      { id: 'mars', name: 'Mars', color: '#d9572b', size: 26, x: 68, y: 320, orbit: true, q: [402, 11093, 11080, 11187, 11268, 11303], desc: 'La planète rouge.' },
      { id: 'jupiter', name: 'Jupiter', color: '#d8b07a', size: 48, x: 32, y: 400, orbit: true, q: [369, 11092, 11137, 4257, 11296], desc: 'La plus grande planète.' },
      { id: 'saturne', name: 'Saturne', color: '#e4d39b', size: 42, x: 68, y: 480, orbit: true, q: [682, 2016, 3081, 11295], desc: 'La planète aux anneaux.' },
      { id: 'uranus', name: 'Uranus', color: '#9fe0ee', size: 34, x: 32, y: 555, orbit: true, q: [11029], desc: 'Elle tourne couchée sur le côté.' },
      { id: 'neptune', name: 'Neptune', color: '#4a6bd8', size: 34, x: 68, y: 625, orbit: true, q: [11056], desc: 'La plus éloignée du Soleil.' },
      { id: 'naines', name: 'Planètes naines', color: '#c9b8a6', size: 20, x: 32, y: 690, orbit: true, q: [11018, 4783, 11138], desc: 'Pluton, Éris, Cérès…' },
      { id: 'cometes', name: 'Comètes et astéroïdes', emo: '☄️', x: 14, y: 778, q: [11033, 11112, 11124, 11184], desc: 'Les petits voyageurs du système solaire.' },
      { id: 'etoiles', name: 'Étoiles', emo: '⭐', x: 38, y: 778, q: [650, 4206, 4258, 4312, 11297, 1155, 11259, 4784], desc: 'Constellations et étoiles du ciel.' },
      { id: 'galaxies', name: 'Galaxies et Univers', emo: '🌌', x: 62, y: 778, q: [61, 11031, 1185, 11134, 11091, 4053, 12, 11059, 11144], desc: 'La Voie lactée et au-delà.' },
      { id: 'conquete', name: 'Conquête spatiale', emo: '🚀', x: 86, y: 778, q: [519, 11034, 11064, 11086, 11140, 11186, 11298, 11105], desc: 'Fusées, sondes, télescopes et astronautes.' }
    ]
  }
};
