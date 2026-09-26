"""Small, auditable demo lexicons. They are easy to replace with learned models later."""

ENGLISH = {
    "a", "am", "anything", "are", "bro", "but", "do", "exam", "for", "have",
    "hello", "i", "interview", "is", "meeting", "my", "please", "preparation",
    "prepare", "should", "the", "today", "tomorrow", "what", "when", "you",
}

HINDI_LATIN = {
    "aaj": ("आज", "today"),
    "aa": ("आ", "come"),
    "aa raha": ("आ रहा", "coming"),
    "hai": ("है", "is"),
    "hain": ("हैं", "are"),
    "kal": ("कल", "tomorrow / yesterday"),
    "karu": ("करूँ", "should I do"),
    "kya": ("क्या", "what"),
    "kuch": ("कुछ", "anything"),
    "mujhe": ("मुझे", "to me / I"),
    "nahi": ("नहीं", "not"),
    "raha": ("रहा", "continuing aspect"),
    "samajh": ("समझ", "understand"),
}

TELUGU_LATIN = {
    "anna": ("అన్నా", "brother / friendly address"),
    "cheyali": ("చేయాలి", "should do"),
    "cheyalo": ("చేయాలో", "what to do"),
    "em": ("ఏం", "what"),
    "enti": ("ఏంటి", "what is it"),
    "ivala": ("ఇవాళ", "today"),
    "naku": ("నాకు", "to me / I have"),
    "repu": ("రేపు", "tomorrow"),
    "rep": ("రేపు", "tomorrow"),
    "undha": ("ఉందా", "is there / do we have"),
    "undhi": ("ఉంది", "there is / I have"),
}

NORMALIZATION_VARIANTS = {
    "broo": "bro",
    "exm": "exam",
    "h": "hai",
    "hey": "hai",
    "raypu": "repu",
    "rep": "repu",
    "repuu": "repu",
    "unda": "undha",
    "undhaa": "undha",
}

TECHNICAL_TERMS = {
    "ai", "api", "css", "dbms", "html", "http", "javascript", "js", "ml",
    "nlp", "python", "react", "sql", "typescript", "ui", "ux",
}
