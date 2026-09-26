'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { ArrowUpRight, ArrowRight, ArrowLeft, Microphone, Check, ShieldCheck, WifiSlash, Translate, Pause, Play, Plus, Minus, TextAa } from '@phosphor-icons/react';
import s from './site.module.css';
gsap.registerPlugin(ScrollTrigger, useGSAP);

const examples = [
  { language: 'Hindi + English', words: 'Aaj meeting ke baad call karna.', meaning: 'Call after the meeting today.', emphasis: 'One sentence. Two languages.', note: 'Word-level review keeps the original beside the English presentation.' },
  { language: 'Telugu + English', words: 'Aame evening vastundi.', meaning: 'She will come in the evening.', emphasis: 'Spelling by ear matters.', note: 'Review sound-alike words in context instead of silently rewriting them.' },
  { language: 'English', words: 'I might join after the call.', meaning: 'The speaker is uncertain about joining after the call.', emphasis: 'Keep uncertainty visible.', note: 'A model suggestion should remain open to correction by the speaker.' },
];
const conditions = [
  { title: 'Between languages.', body: 'Automatic speech detection begins with the words you actually use, including mixed-language sentences.', icon: Translate },
  { title: 'Spelled by ear.', body: 'Inspect the original transcript and review possible corrections without losing what the model heard.', icon: TextAa },
  { title: 'Beyond the signal.', body: 'Prepare the speech model and website while connected, then transcribe locally without internet.', icon: WifiSlash },
];

export function Landing() {
  const root = useRef<HTMLElement>(null); const [example, setExample] = useState(0); const [condition, setCondition] = useState(0); const [paused, setPaused] = useState(false);
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('[data-intro]', { y: 28, opacity: 0, duration: .95, stagger: .11, ease: 'power3.out' });
      gsap.from('[data-scene]', { y: 60, scale: .97, opacity: 0, duration: 1.25, delay: .3, ease: 'power3.out' });
      gsap.from('[data-reveal-word]', { opacity: .17, stagger: .08, ease: 'none', scrollTrigger: { trigger: '[data-manifesto]', start: 'top 80%', end: 'bottom 55%', scrub: true } });
      gsap.utils.toArray<HTMLElement>('[data-rise]').forEach(element => gsap.from(element, { y: 45, opacity: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: element, start: 'top 90%', once: true } }));
      gsap.to('[data-wave]', { scaleY: .35, duration: .65, stagger: { each: .05, from: 'center', repeat: -1, yoyo: true }, ease: 'sine.inOut' });
    });
    media.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
      const cards = gsap.utils.toArray<HTMLElement>('[data-step]');
      cards.slice(0, -1).forEach((card, index) => gsap.to(card, { scale: .96 - index * .01, opacity: .6, scrollTrigger: { trigger: card, start: 'top 150px', endTrigger: cards[index + 1], end: 'top 165px', pin: true, pinSpacing: false, scrub: true } }));
    });
    return () => media.revert();
  }, { scope: root });
  const selected = examples[example];
  return <main className={s.landing} ref={root}>
    <section className={s.hero}>
      <p data-intro className={s.eyebrow}>AI / MACHINE LEARNING · CODE-SWITCHING AND SPELLING BY EAR</p>
      <h1 data-intro>Every language.<br /><span>Every word.</span></h1>
      <p data-intro className={s.heroDescription}>Record natural speech, inspect mixed-language words, and present the transcript in the language you choose. Local models work after preparation—even offline.</p>
      <div data-intro className={s.heroActions}><Link href="/transcribe" className={s.primary}>Start transcribing <span><ArrowUpRight size={20} /></span></Link><a href="#how" className={s.secondary}>See how it works <ArrowRight size={18} /></a></div>
      <div data-scene className={s.sceneShell}><div className={s.scene}>
        <Image src="/images/worksite.jpg" alt="Abstract landscape behind a multilingual transcription example" fill priority sizes="(max-width: 768px) 100vw, 1200px" className={s.sceneImage} />
        <div className={s.sceneWash} />
        <div className={s.sceneLabel}><span /> LOCAL SPEECH STUDIO.</div>
        <p className={s.sceneCaption}>Switch languages.<br />Keep the sentence.</p>
        <div className={s.previewCard}>
          <div className={s.previewTop}><span className={s.previewMic}><Microphone size={22} weight="light" /></span><div><strong>In your own words</strong><small>Illustrative transcript · Hindi + English</small></div><span className={s.recordDot} /></div>
          <div className={s.wave} aria-hidden="true">{Array.from({ length: 42 }, (_, i) => <i key={i} data-wave style={{ height: `${12 + Math.abs(Math.sin(i * 1.87)) * 35}px` }} />)}</div>
          <p className={s.previewQuote}>“Aaj meeting ke baad<br /><mark>call karna.</mark>”</p>
          <div className={s.previewResult}><span><Check size={15} /> English presentation</span><p>Call after the meeting<br /><strong>today.</strong></p></div>
          <div className={s.previewBottom}><ShieldCheck size={16} /><span>Original stays available to review.</span><ArrowUpRight size={18} /></div>
        </div>
        <div className={s.sceneFoot}><span>LOCAL SPEECH AI, HUMAN-REVIEWED</span><span>FIELDPROOF / LANGUAGE WITHOUT BARRIERS</span></div>
      </div></div>
    </section>
    <section className={s.languageStrip} aria-label="Mixed-language input"><div className={`${s.marquee} ${paused ? s.paused : ''}`}><div>{[0, 1].map(copy => <span key={copy} aria-hidden={copy === 1}>Your words <i /> आपकी भाषा <i /> మీ మాటలు <i /> Your words <i /> आपकी भाषा <i /> మీ మాటలు <i /></span>)}</div></div><button aria-label={paused ? 'Play language animation' : 'Pause language animation'} onClick={() => setPaused(!paused)}>{paused ? <Play size={16} /> : <Pause size={16} />}</button></section>
    <section id="why" className={s.manifesto} data-manifesto><p className={s.eyebrow}>REAL SPEECH. REAL WORDS.</p><h2>{'The world doesn’t speak in perfect forms.'.split(' ').map((word, i) => <span key={i} data-reveal-word>{word} </span>)}<br /><em>{'Neither should you.'.split(' ').map((word, i) => <span key={i} data-reveal-word>{word} </span>)}</em></h2><p>A little Hindi. A little English. A phrase spelled the way it sounds.<br />Transcribe it, review it, and keep both the original and the presentation.</p></section>
    <section className={s.featureGrid} aria-label="Language AI features">
      <article data-rise className={s.languageCard}><div className={s.featureIcon}><Translate size={28} weight="light" /></div><h3>Code-switch.<br />Don’t context-switch.</h3><p>Start with mixed languages and spelling by ear. Keep your original words beside every interpretation.</p><div className={s.wordTokens}><span>aaj</span><span>meeting</span><span>ke baad</span><span>call karna</span></div></article>
      <article data-rise className={s.localCard}><div className={s.orbit} aria-hidden="true"><span /><span /><div><WifiSlash size={44} weight="light" /></div></div><h3>Your device.<br />Your transcript.</h3><p>Local speech AI on supported browsers.<br />No cloud inference required.</p><Link href="/transcribe">Prepare this browser <ArrowUpRight size={18} /></Link></article>
      <article data-rise className={s.sunCard}><TextAa size={42} weight="light" /><h3>Hear it.<br />Spell it.</h3><p>Review word boundaries and possible spellings before sharing the result.</p><div className={s.contrastDemo} aria-hidden="true"><span>ఆ</span><span>Aa</span></div></article>
      <article data-rise className={s.evidenceCard}><div><ShieldCheck size={28} weight="light" /><h3>Original beside translation.</h3><p>Check the spoken words against the chosen presentation language.</p></div><div className={s.evidenceLines}><div><span>Original</span><strong>Aaj meeting ke baad</strong><small>Hindi + English</small></div><div><span>English</span><strong>After the meeting today</strong><small>Example translation</small></div></div></article>
    </section>
    <section id="how" className={s.walkthrough}>
      <div className={s.sectionHeading} data-rise><div><p className={s.eyebrow}>FROM SOUND TO SCRIPT</p><h2>A few words.<br />A clearer picture.</h2></div><p>AI helps with recognition.<br />You stay in charge of the wording.</p></div>
      <div className={s.steps}>
        <article data-step className={s.step}><span className={s.stepNumber}>01</span><div><h3>Say it your way.</h3><p>Record or upload natural speech. Automatic mode starts without making you pick a language first.</p></div><div className={s.stepVisual}><Microphone size={30} weight="light" /><div className={s.miniWave} aria-hidden="true">{Array.from({ length: 24 }, (_, i) => <i key={i} style={{ height: 8 + Math.abs(Math.sin(i)) * 34 }} />)}</div><span>AUDIO PROCESSED ON THIS DEVICE</span></div></article>
        <article data-step className={`${s.step} ${s.stepGreen}`}><span className={s.stepNumber}>02</span><div><h3>Review every word.</h3><p>Inspect mixed-language words, sentence boundaries and spelling suggestions against the original audio.</p></div><div className={s.stepVisual}><span className={s.checkCircle}><Check size={28} /></span><strong>“vastundi”</strong><span>CHECK THE WORD IN CONTEXT.</span></div></article>
        <article data-step className={`${s.step} ${s.stepDark}`}><span className={s.stepNumber}>03</span><div><h3>Present and keep it.</h3><p>Choose English or another presentation language, then save or export the reviewed transcript.</p></div><div className={s.deliveryIllustration}><div><Check size={18} /><span>Original available</span></div><i /><div><WifiSlash size={18} /><span>Saved on this device</span></div></div></article>
      </div>
    </section>
    <section className={s.exampleSection} data-rise><div className={s.exampleIntro}><p className={s.eyebrow}>SMALL WORDS. BIG DIFFERENCE.</p><h2>{selected.emphasis}</h2><p>{selected.note}</p><div className={s.carouselControls}><button aria-label="Previous example" onClick={() => setExample((example + 2) % 3)}><ArrowLeft size={20} /></button><span>{example + 1} / 3</span><button aria-label="Next example" onClick={() => setExample((example + 1) % 3)}><ArrowRight size={20} /></button></div></div><div className={s.exampleQuote} key={example}><small>ILLUSTRATIVE EXAMPLE / {selected.language}</small><blockquote>“{selected.words}”</blockquote><div><span>INTENDED MEANING</span><p>{selected.meaning}</p></div><small>Example interpretation, not a measured model result.</small></div></section>
    <section className={s.conditions} data-rise><p className={s.eyebrow}>WHERE LANGUAGE CHANGES</p><h2>Built for real speech.</h2><div className={s.accordions}>{conditions.map((item, index) => <article className={condition === index ? s.expanded : ''} key={item.title}><button aria-expanded={condition === index} aria-controls={`condition-${index}`} onClick={() => setCondition(index)}><item.icon size={30} weight="light" /><span>{item.title}</span>{condition === index ? <Minus size={20} /> : <Plus size={20} />}</button><p id={`condition-${index}`} hidden={condition !== index}>{item.body}</p></article>)}</div></section>
    <section className={s.finalCta}><div className={s.ctaLines} aria-hidden="true" /><p className={s.eyebrow}>YOUR WORDS. IN YOUR LANGUAGE.</p><h2>Natural speech deserves<br />to be understood.</h2><Link href="/transcribe" className={s.primary}>Open your transcriber <span><ArrowUpRight size={22} /></span></Link><p>Prepare local AI once, then test it offline.</p></section>
    <footer className={s.footer}><Link href="/" className={s.logo}><span className={s.logoMark} aria-hidden="true"><i /><i /><i /></span>fieldproof.</Link><span>Code-switching and spelling by ear.</span><div><Link href="/transcribe">Transcribe</Link><Link href="/analyze">Language lab</Link><Link href="/about">How it works</Link></div></footer>
  </main>;
}
