# Data attribution

The `data/ielts-core-1000.json` vocabulary dataset is derived without modification from [TOEFL & IELTS Academic Vocabulary Dataset](https://github.com/gungorkaya-eng/toefl-essential-vocabulary-dataset), published by WordLevel under the MIT License.

The dataset contains 1,000 high-frequency academic words with parts of speech, difficulty levels, themes, synonyms, English definitions, and contextual example sentences. The upstream publisher requests a link to [WordLevel](https://wordlevel.net) when the dataset is used in a public project.

The upstream license is preserved at `licenses/WORDLEVEL-MIT-LICENSE.txt`.

The `data/cefr-word-list.csv` recognition vocabulary is derived from [Words CEFR Dataset](https://github.com/Maximax67/Words-CEFR-Dataset), created by Maxim Belikov and published under the MIT License. It supplies CEFR A1–C2 levels and parts of speech for 7,988 source rows. The app removes case-insensitive duplicates when loading the file.

The upstream license is preserved at `licenses/WORDS-CEFR-MIT-LICENSE.txt`.

The `data/cefr-c1-c2-word-list.csv` advanced recognition vocabulary is the [Octanove Vocabulary Profile C1/C2](https://github.com/openlanguageprofiles/olp-en-cefrj/blob/master/octanove-vocabulary-profile-c1c2-1.0.csv), created by Octanove Labs and distributed through Open Language Profiles under the Creative Commons Attribution-ShareAlike 4.0 International License. This project combines it with the A1–B2 list and removes duplicate headwords, retaining the higher CEFR level when a word appears in both sources.

The license text is preserved at `licenses/OCTANOVE-CC-BY-SA-4.0.txt`.
