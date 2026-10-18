/* ============================================================
   KULTIVO — banque de questions de l'ENTRAÎNEMENT PAR THÈME
   Questions réservées à ce mode : elles n'apparaissent jamais dans le parcours.
   Chaque thème a son fichier (entrainement/<theme>.js) qui ajoute ses questions avec TRAINING_QUESTIONS.push(…).
   Format identique au parcours : { id, theme, d (1 à 5), q, a: [réponses acceptées], exp }
   (+ facultatif : flag, photo/photoSize/credit, rebus).
   Les id commencent à 10000 (jamais utilisés par le parcours) ; un bloc de 1000 par thème :
     Histoire 10000 · Sciences 11000 · Géographie 12000 · Technologie 13000 · Musique 14000
     Littérature 15000 · Jeux 16000 · Cinéma 17000 · Gastronomie 18000 · Sport 19000 · Arts 20000
     Langue française 21000 · Mythologie 22000 · Drapeaux 23000 · Monuments 24000
   Ajouter des questions ne casse rien : la progression est enregistrée par id, les paliers se recalculent.
   ============================================================ */
const TRAINING_QUESTIONS = [];
const TRAINING_ID_MIN = 10000;
