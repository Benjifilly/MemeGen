
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { MemeCanvas, MemeCanvasHandle } from './components/MemeCanvas';
import { Button } from './components/Button';
import { AiGenerator } from './components/AiGenerator';
import { MemeText, MemeSticker, MemeLayer, Tab, HistoryState } from './types';
import { generateMagicCaptions, editMemeImage } from './services/geminiService';
import { Type, Wand2, Edit, Plus, Trash2, ArrowLeft, AlignLeft, AlignCenter, AlignRight, Undo, Redo, RotateCw, Type as FontIcon, X, Sparkles, ChevronUp, ChevronDown, Palette, LayoutTemplate, Smile, Sticker as StickerIcon, Search, Shapes, Grid, AlertCircle, Check, Maximize, Move, RefreshCw, Clock, Flame, Star, Loader2, Circle, Zap, Heart, Flag, Coffee, Car, Dumbbell, Lightbulb, RotateCcw, Scaling, Download, Copy, Share, FileImage, Share2, Image as ImageIcon, Monitor } from 'lucide-react';

const FONTS = [
  { name: 'Oswald', label: 'Oswald (Default)' },
  { name: 'Anton', label: 'Anton (Impact-like)' },
  { name: 'Bangers', label: 'Bangers (Comic)' },
  { name: 'Comic Neue', label: 'Comic Neue' },
  { name: 'Roboto', label: 'Roboto' },
];

const FILTERS = [
    { name: 'Normal', value: 'none' },
    { name: 'B&W', value: 'grayscale(100%)' },
    { name: 'Noir', value: 'grayscale(100%) contrast(150%) brightness(90%)' },
    { name: 'Fried', value: 'contrast(200%) saturate(200%)' },
    { name: 'Vintage', value: 'sepia(50%) contrast(80%) brightness(120%)' },
    { name: 'Sepia', value: 'sepia(100%)' },
    { name: 'Warm', value: 'sepia(30%) saturate(140%)' },
    { name: 'Cool', value: 'hue-rotate(30deg) contrast(120%)' },
    { name: 'Cyber', value: 'hue-rotate(190deg) saturate(200%) contrast(120%)' },
    { name: 'Dreamy', value: 'brightness(110%) saturate(120%) blur(0.5px)' },
    { name: 'Invert', value: 'invert(100%)' },
    { name: 'Blur', value: 'blur(3px)' },
    { name: 'Ghost', value: 'opacity(50%) blur(1px)' },
];

// GIPHY API Configuration
const GIPHY_API_KEY = 'cSEyxg1j17Bzc0BPQsoEtKqQajqvG06x'; 
const GIPHY_BASE_URL = 'https://api.giphy.com/v1/stickers';

// Helper for CORS Proxy
const getProxiedUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('data:')) return url;
    // Use weserv.nl to proxy and convert GIF to PNG frame for canvas
    return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&output=png`;
};

// COMPLETE EMOJI LIST with Icons for Navigation
const EMOJI_GROUPS = [
    { 
        name: "Smileys & People", 
        icon: <Smile className="w-5 h-5" />,
        emojis: ["😀","😃","😄","😁","😆","😅","😂","🤣","🥲","🥹","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚","😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🥸","🤩","🥳","😏","😒","😞","😔","😟","😕","🙁","☹️","😣","😖","😫","😩","🥺","😢","😭","😤","😠","😡","🤬","🤯","😳","🥵","🥶","😱","😨","😰","😥","😓","🤗","🤔","🫣","🤭","🫢","🫡","🤫","🫠","🤥","😶","🫥","😐","😑","😬","🙄","😯","😦","😧","😮","😲","🥱","😴","🤤","😪","😵","😵‍💫","🤐","🥴","🤢","🤮","🤧","😷","🤒","🤕","🤑","🤠","😈","👿","👹","👺","🤡","💩","👻","💀","☠️","👽","👾","🤖","🎃","👋","🤚","🖐","✋","🖖","👌","🤌","🤏","✌️","🤞","🫰","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","👍","👎","✊","👊","🤛","🤜","👏","🙌","🫶","👐","🤲","🤝","🙏","✍️","💅","🤳","💪","🦾","🦵","🦿","🦶","👣","👂","🦻","👃","🫀","🫁","🧠","🦷","🦴","👀","👁","👅","👄","💋","🩸"] 
    },
    { 
        name: "Animals & Nature", 
        icon: <Zap className="w-5 h-5" />, // Using Zap as generic nature/energy placeholder or leaf if available
        emojis: ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐻‍❄️","🐨","🐯","🦁","🐮","🐷","🐽","🐸","🐵","🐵","🙉","🙊","🐒","🐔","🐧","🐦","🐤","🐣","🐥","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🪱","🐛","🦋","🐌","🐞","🐜","🪰","🪲","🪳","🦟","🦗","🕷","🕸","🦂","🐢","🐍","🦎","🦖","🦕","🐙","🦑","🦐","🦞","🦀","🐡","🐠","🐟","🐬","🐳","🐋","🦈","🐊","🐅","🐆","🦓","🦍","🦧","🦣","🐘","🦛","🦏","🐪","🐫","🦒","🦘","🦬","🐃","🐂","🐄","🐎","🐖","🐏","🐑","🦙","🐐","🦌","🐕","🐩","🦮","🐕‍🦺","🐈","🐈‍⬛","🪶","🐓","🦃","🦤","🦚","🦜","🦢","🦩","🕊","🐇","🦝","🦨","🦡","🦫","🦦","🦥","🐁","🐀","🐿","🦔","🐾","🐉","🐲","🌵","🎄","🌲","🌳","🌴","🪵","🌱","🌿","☘️","🍀","🎍","🪴","🎋","🍃","🍂","🍁","🍄","🌾","💐","🌷","🌹","🥀","🌺","🌸","🌼","🌻"] 
    },
    { 
        name: "Food & Drink", 
        icon: <Coffee className="w-5 h-5" />,
        emojis: ["🍇","🍈","🍉","🍊","🍋","🍌","🍍","🥭","🍎","🍏","🍐","🍐","🍑","🍒","🍓","🫐","🥝","🍅","🫒","🥥","🥑","🍆","🥔","🥕","🌽","🌶","🫑","🥒","🥬","🥦","🧄","🧅","🍄","🥜","🫘","🌰","🍞","🥐","🥖","🫓","🥨","🥯","🥞","🧇","🧀","🍖","🍗","🥩","🥓","🍔","🍟","🍕","🌭","🥪","🌮","🌯","🫔","🥙","🧆","🥚","🍳","🥘","🍲","🫕","🥣","🥗","🍿","🧈","🧂","🥫","🍱","🍘","🍙","🍚","🍛","🍜","🍝","🍠","🍢","🍣","🍤","🍥","🥮","🍡","🥟","🥠","🥡","🍦","🍧","🍨","🍩","🍪","🎂","🍰","🧁","🥧","🍫","🍬","🍭","🍮","🍯","🍼","🥛","☕","🫖","🍵","🍶","🍾","🍷","🍸","🍹","🍺","🍻","🥂","🥃","🥤","🧋","🧃","🧉","🧊"] 
    },
    {
        name: "Activity",
        icon: <Dumbbell className="w-5 h-5" />,
        emojis: ["⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🪀","🏓","🏸","🏒","🏑","🥍","🏏","🪃","🥅","⛳","🪁","🏹","🎣","🤿","🥊","🥋","🎽","🛹","🛼","🛷","⛸","🥌","🎿","⛷","🏂","🪂","🏋️","🤼","🤸","⛹️","🤺","🤾","🏌️","🏇","🧘","🏄","🏊","🤽","🚣","🧗","🚵","🚴","🏆","🥇","🥈","🥉","🏅","🎖","🏵","🎗","🎫","🎟","🎪","🤹","🎭","🩰","🎨","🎬","🎤","🎧","🎼","🎹","🥁","🪘","🎷","🎺","🪗","🎸","🪕","🎻","🎲","♟","🎯","🎳","🎮","🎰","🧩"]
    },
    {
        name: "Travel & Places",
        icon: <Car className="w-5 h-5" />,
        emojis: ["🚗","🚕","🚙","🚌","🚎","🏎","🚓","🚑","🚒","🚐","🛻","🚚","🚛","🚜","🦯","🦽","🦼","🛴","🚲","🛵","🏍","🛺","🚨","🚔","🚍","🚘","🚖","🚡","🚠","🚟","🚃","🚋","🚞","🚝","🚄","🚅","🚈","🚂","🚆","🚇","🚊","🚉","✈️","🛫","🛬","🛩","💺","🛰","🚀","🛸","🚁","🛶","⛵","🚤","🛥","🛳","⛴","🚢","⚓","🛟","🪝","⛽","🚧","🚦","🚥","🚏","🗺","🗿","🗽","🗼","🏰","🏯","🏟","🎡","🎢","🎠","⛲","⛱","🏖","🏝","🏜","🌋","⛰","🏔","🗻","🏕","⛺","🏠","🏡","🏘","🏚","🏗","🏭","🏢","🏬","🏣","🏤","🏥","🏦","🏨","🏪","🏫","🏩","💒","🏛","⛪","🕌","🕍","🛕","🕋","⛩","🛤","🛣","🗾","🎑","🏞","🌅","🌄","🌠","🎇","🎆","🌇","🌆","🏙","🌃","🌃","🌌","🌉","🌁"]
    },
    {
        name: "Objects",
        icon: <Lightbulb className="w-5 h-5" />,
        emojis: ["⌚","📱","📲","💻","⌨️","🖥","🖨","🖱","🖲","🕹","🗜","💽","💾","💿","📀","📼","📷","📸","📹","🎥","📽","🎞","📞","☎️","📟","📠","📺","📻","🎙","🎚","🎛","🧭","⏱","⏲","⏰","🕰","⌛","⏳","📡","🔋","🔌","💡","🔦","🕯","🪔","🧯","🛢","💸","💵","💴","💶","💷","🪙","💰","💳","💎","⚖️","🪜","🧰","🪛","🔧","🔨","⚒","🛠","⛏","🪚","🔩","⚙️","🪤","🧱","⛓","🧲","🔫","💣","🧨","🪓","🔪","🗡","⚔️","🛡","🚬","⚰️","🪦","⚱️","🏺","🔮","📿","🧿","💈","🧲","⚗️","🔭","🔬","🕳","🩹","🩺","💊","💉","🩸","🧬","🦠","🧫","🧪","🌡","🧹","🪠","🧺","🧻","🚽","🚰","🚿","🛁","🛀","🧼","🪥","🪒","🧽","🪣","🧴","🛎","🔑","🗝","🚪","🪑","🛋","🛏","🛌","🧸","🪆","🖼","🪞","💎","🛍","🛒","🎁","🎈","🎏","🎀","🪄","🪅","🎊","🎉","🎎","🏮","🎐","🧧","✉️","📩","📨","📧","💌","📥","📤","📦","🏷","🪧","📪","📫","📬","📭","📮","📯","📜","📃","📄","📑","🧾","📊","📈","📉","🗒","🗓","📆","📅","🗑","📇","🗃","🗳","🗄","📋","📁","📂","🗂","🗞","📰","📓","📔","📒","📕","📗","📘","📙","📚","📖","🔖","🧷","🔗","📎","🖇","📐","📏","🧮","📌","📍","✂️","🖊","🖋","✒️","🖌","🖍","📝","✏️","🔍","🔎","🔏","🔐","🔒","🔓"]
    },
    {
        name: "Symbols",
        icon: <Heart className="w-5 h-5" />,
        emojis: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","❣️","💕","💞","💓","💗","💖","💘","💝","💟","☮️","✝️","☪️","🕉","☸️","✡️","🔯","🕎","☯️","☦️","🛐","⛎","♈","♉","♊","♋","♋","♌","♍","♎","♏","♐","♑","♒","♓","🆔","⚛️","🉑","☢️","☣️","📴","📳","🈶","🈚","🈸","🈺","🈷️","✴️","🆚","💮","🉐","㊙️","㊗️","🈴","🈵","🈹","🈲","🅰️","🅱️","🆎","🆑","🅾️","🆘","❌","⭕","🛑","⛔","📛","🚫","💯","💢","♨️","🚷","🚯","🚳","🚱","🔞","📵","🚭","❗️","❕","❓","❔","‼️","⁉️","🔅","🔆","〽️","⚠️","🚸","🔱","⚜️","🔰","♻️","✅","🈯","💹","❇️","✳️","❎","🌐","💠","Ⓜ️","🌀","💤","🏧","🚾","♿","🅿️","🛗","🈳","🈂️","🛂","🛃","🛄","🛅","🚹","🚺","🚼","⚧","🚻","🚮","🎦","📶","🈁","🔣","ℹ️","🔣","🔡","🔠","🆖","🆗","🆙","🆒","🆕","🆓","0️⃣","1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟","🔢","#️⃣","*️⃣","⏏️","▶️","⏸","⏯","⏹","⏺","⏭","⏮","⏩","⏪","⏫","⏬","◀️","🔼","🔽","➡️","⬅️","⬆️","⬇️","↗️","↘️","↙️","↖️","↕️","↔️","↪️","↩️","⤴️","⤵️","🔀","🔁","🔂","🔄","🔃","🎵","🎶","➕","➖","➗","✖️","♾","💲","💱","™","©️","®️","👁‍🗨","🔚","🔙","🔛","🔝","🔜","〰️","➰","➿","✔️","☑️","🔘","🔴","🟠","🟡","🟢","🔵","🟣","⚫","⚪","🟤","🔺","🔻","🔸","🔹","🔶","🔷","🔳","🔲","▪️","▫️","◾","◽","◼️","◻️","🟥","🟧","🟨","🟩","🟦","🟪","⬛","⬜","🟫","🔈","🔇","🔉","🔊","🔔","🔕","📣","📢","💬","💭","🗯","♠️","♣️","♥️","♦️","🃏","🎴","🀄","🕐","🕑","🕒","🕒","🕓","🕔","🕕","🕖","🕗","🕘","🕙","🕚","🕛","🕜","🕝","🕞","🕟","🕠","🕡","🕢","🕣","🕤","🕥","🕦","🕧"]
    },
    {
        name: "Flags",
        icon: <Flag className="w-5 h-5" />,
        emojis: ["🏳️","🏴","🏁","🚩","🏳️‍🌈","🏳️‍⚧️","🏴‍☠️","🇦🇫","🇦🇱","🇩🇿","🇦🇸","🇦🇩","🇦🇴","🇦🇮","🇦🇶","🇦🇬","🇦🇷","🇦🇲","🇦🇼","🇦🇺","🇦🇹","🇦🇿","🇧🇸","🇧🇭","🇧🇩","🇧🇧","🇧🇾","🇧🇪","🇧🇿","🇧🇯","🇧🇲","🇧🇹","🇧🇴","🇧🇦","🇧🇼","🇧🇹","🇧🇷","🇮🇴","🇻🇬","🇧🇳","🇧🇬","🇧🇫","🇧🇮","🇰🇭","🇨🇲","🇨🇦","🇮🇨","🇨🇻","🇧🇶","🇰🇾","🇨🇫","🇹🇩","🇨🇱","🇨🇳","🇨🇽","🇨🇨","🇨🇴","🇰🇲","🇨🇬","🇨🇩","🇨🇰","🇨🇷","🇨🇮","🇭🇷","🇨🇺","🇨🇼","🇨🇾","🇨🇿","🇩🇰","🇩🇯","🇩🇲","🇩🇴","🇪🇨","🇪🇬","🇸🇻","🇬🇶","🇪🇷","🇪🇪","🇪🇹","🇪🇺","🇫🇰","🇫🇴","🇫🇯","🇫🇮","🇫🇷","🇬🇫","🇵🇫","🇹🇫","🇬🇦","🇬🇲","🇬🇪","🇩🇪","🇬🇭","🇬🇮","🇬🇷","🇬🇱","🇬🇩","🇬🇵","🇬🇺","🇬🇹","🇬🇬","🇬🇳","🇬🇼","🇬🇾","🇭🇹","🇭🇳","🇭🇰","🇭🇺","🇮🇸","🇮🇳","🇮🇩","🇮🇷","🇮🇶","🇮🇪","🇮🇲","🇮🇱","🇮🇹","🇯🇲","🇯🇵","🇯🇪","🇯🇴","🇰🇿","🇰🇪","🇰🇮","🇽🇰","🇰🇼","🇰🇬","🇱🇦","🇱🇻","🇱🇧","🇱🇸","🇱🇷","🇱🇾","🇱🇮","🇱🇹","🇱🇺","🇲🇴","🇲🇰","🇲🇬","🇲🇼","🇲🇾","🇲🇻","🇲🇱","🇲🇹","🇲🇭","🇲🇶","🇲🇷","🇲🇺","🇾🇹","🇲🇽","🇫🇲","🇲🇩","🇲🇨","🇲🇳","🇲🇪","🇲🇸","🇲🇦","🇲🇿","🇲🇲","🇳🇦","🇳🇷","🇳🇵","🇳🇱","🇳🇨","🇳🇿","🇳🇮","🇳🇪","🇳🇬","🇳🇺","🇳🇫","🇰🇵","🇲🇵","🇳🇴","🇴🇲","🇵🇰","🇵🇼","🇵🇸","🇵🇦","🇵🇬","🇵🇾","🇵🇪","🇵🇭","🇵🇳","🇵🇱","🇵🇹","🇵🇷","🇶🇦","🇷🇪","🇷🇴","🇷🇺","🇷🇼","🇼🇸","🇸🇲","🇸🇹","🇸🇦","🇸🇳","🇷🇸","🇸🇨","🇸🇱","🇸🇬","🇸🇽","🇸🇰","🇸🇮","🇸🇧","🇸🇴","🇿🇦","🇬🇸","🇰🇷","🇸🇸","🇪🇸","🇱🇰","🇧🇱","🇸🇭","🇰🇳","🇱🇨","🇵🇲","🇻🇨","🇸🇩","🇸🇷","🇸🇿","🇸🇪","🇨🇭","🇸🇾","🇹🇼","🇹🇯","🇹🇿","🇹🇭","🇹🇱","🇹🇬","🇹🇰","🇹🇴","🇹🇹","🇹🇳","🇹🇷","🇹🇲","🇹🇨","🇹🇻","🇺🇬","🇺🇦","🇦🇪","🇬🇧","🇺🇸","🇺🇾","🇺🇿","🇻🇺","🇻🇦","🇻🇪","🇻🇳","🇼🇫","🇪🇭","🇾🇪","🇿🇲","🇿🇼"]
    }
];

// Helper to convert Emoji to Image URL (High Resolution)
const emojiToDataURL = (emoji: string, size = 256) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if(ctx) {
        ctx.font = `${size * 0.8}px "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Offset slightly to center vertically for most fonts
        ctx.fillText(emoji, size/2, size/2 * 1.1);
        return canvas.toDataURL();
    }
    return '';
};

type AppView = 'HOME' | 'AI_GENERATOR' | 'EDITOR';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('HOME');
  const [aiStartPrompt, setAiStartPrompt] = useState("");

  const [image, setImage] = useState<string | null>(null);
  const [layers, setLayers] = useState<MemeLayer[]>([]);
  const canvasRef = useRef<MemeCanvasHandle>(null);
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.CAPTION);
  const [imageFilter, setImageFilter] = useState('none');

  // Sticker Tab State
  const [stickerSearch, setStickerSearch] = useState("");
  const [stickerTabMode, setStickerTabMode] = useState<'emoji' | 'library'>('library');
  const [stickerResults, setStickerResults] = useState<{id: string, url: string, title: string}[]>([]);
  const [isLoadingStickers, setIsLoadingStickers] = useState(false);
  const [activeEmojiGroup, setActiveEmojiGroup] = useState("Smileys & People");
  
  // Refs for scrolling
  const emojiGroupsRef = useRef<{[key: string]: HTMLDivElement | null}>({});
  const emojiContainerRef = useRef<HTMLDivElement>(null);

  // Modals
  const [showMagicModal, setShowMagicModal] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestedCaptions, setSuggestedCaptions] = useState<string[]>([]);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const [isGeneratingEdit, setIsGeneratingEdit] = useState(false);
  const [generatedEditImage, setGeneratedEditImage] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [previewFilter, setPreviewFilter] = useState('none');

  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [finalImagePreview, setFinalImagePreview] = useState<string | null>(null);
  const [exportFilename, setExportFilename] = useState("my-meme");
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg'>('png');
  const [exportQuality, setExportQuality] = useState(0.9);
  const [exportDimensions, setExportDimensions] = useState({ width: 0, height: 0 });
  const [copySuccess, setCopySuccess] = useState(false);

  // History
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const saveHistory = useCallback((newLayers: MemeLayer[], newImage?: string | null, newFilter?: string) => {
    const stateToSave: HistoryState = {
        layers: JSON.parse(JSON.stringify(newLayers)),
        image: newImage !== undefined ? newImage : image,
        filter: newFilter !== undefined ? newFilter : imageFilter
    };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(stateToSave);
    if (newHistory.length > 30) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex, image, imageFilter]);

  const handleImageSelect = (base64: string) => {
    setImage(base64);
    setLayers([]);
    setImageFilter('none');
    setHistory([{ layers: [], image: base64, filter: 'none' }]);
    setHistoryIndex(0);
    setSuggestedCaptions([]);
    setActiveTab(Tab.CAPTION);
    setSelectedId(null);
    setView('EDITOR');
  };

  const handleNavigateToAi = (initialPrompt: string) => {
      setAiStartPrompt(initialPrompt);
      setView('AI_GENERATOR');
  };

  const addText = (content: string = "DOUBLE TAP TO EDIT") => {
    const newText: MemeText = {
      type: 'text',
      id: Date.now().toString(),
      content,
      x: 50,
      y: layers.length === 0 ? 15 : 50,
      color: '#FFFFFF',
      fontSize: 40,
      boxWidth: 400,
      textAlign: 'center',
      rotation: 0,
      fontFamily: 'Oswald'
    };
    const newLayers = [...layers, newText];
    setLayers(newLayers);
    setSelectedId(newText.id);
    saveHistory(newLayers);
  };

  // Helper to get image natural dimensions before adding
  const getImageDimensions = (url: string): Promise<{width: number, height: number}> => {
      return new Promise((resolve) => {
          const img = new Image();
          img.src = url;
          img.onload = () => {
              resolve({ width: img.naturalWidth, height: img.naturalHeight });
          };
          img.onerror = () => {
              resolve({ width: 150, height: 150 });
          };
      });
  };

  const addSticker = async (rawUrl: string) => {
      const url = getProxiedUrl(rawUrl);
      
      const dims = await getImageDimensions(url);
      
      // Calculate initial size preserving aspect ratio
      const aspectRatio = dims.width / dims.height;
      const initialWidth = 200;
      const initialHeight = initialWidth / aspectRatio;

      // Ensure unique ID with random suffix to allow multiple same stickers
      const uniqueId = `sticker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const newSticker: MemeSticker = {
          type: 'sticker',
          id: uniqueId,
          url,
          x: 50,
          y: 50,
          width: initialWidth,
          height: initialHeight,
          rotation: 0
      };
      
      setLayers(prev => {
          const updated = [...prev, newSticker];
          setTimeout(() => saveHistory(updated), 0);
          return updated;
      });
      setSelectedId(newSticker.id);
  };

  const updateLayer = (id: string, updates: Partial<MemeLayer>) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l) as MemeLayer[]);
  };

  const removeLayer = (id: string) => {
    const newLayers = layers.filter(l => l.id !== id);
    setLayers(newLayers);
    if (selectedId === id) setSelectedId(null);
    saveHistory(newLayers);
  };

  const resetLayerPosition = (id: string) => {
      setLayers(prev => prev.map(l => {
          if(l.id !== id) return l;
          if(l.type === 'text') return { ...l, x: 50, y: 50, rotation: 0, fontSize: 40, boxWidth: 400 };
          return { ...l, x: 50, y: 50, rotation: 0 };
      }));
      setTimeout(() => saveHistory(layers), 0); 
  };

  const resetAllLayers = () => {
      if (confirm("Reset positions of all layers?")) {
          const newLayers = layers.map(l => ({ ...l, x: 50, y: 50, rotation: 0 }));
          setLayers(newLayers);
          saveHistory(newLayers);
      }
  };

  const moveLayer = (id: string, direction: 'up' | 'down') => {
      const index = layers.findIndex(l => l.id === id);
      if (index === -1) return;
      const newLayers = [...layers];
      if (direction === 'up' && index < newLayers.length - 1) {
          [newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]];
      } else if (direction === 'down' && index > 0) {
          [newLayers[index], newLayers[index - 1]] = [newLayers[index - 1], newLayers[index]];
      } else {
          return;
      }
      setLayers(newLayers);
      saveHistory(newLayers);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setLayers(JSON.parse(JSON.stringify(prev.layers)));
      setImage(prev.image);
      setImageFilter(prev.filter);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setLayers(JSON.parse(JSON.stringify(next.layers)));
      setImage(next.image);
      setImageFilter(next.filter);
    }
  };

  const scrollToEmojiGroup = (name: string) => {
      const el = emojiGroupsRef.current[name];
      if (el) {
          el.scrollIntoView({ behavior: 'auto', block: 'start' });
          setActiveEmojiGroup(name);
      }
  };

  // Scroll Spy for Emojis
  const handleEmojiScroll = () => {
      if (!emojiContainerRef.current) return;
      
      // Very simple spy logic
      const containerTop = emojiContainerRef.current.scrollTop;
      
      for (const group of EMOJI_GROUPS) {
          const el = emojiGroupsRef.current[group.name];
          if (el) {
              const offset = el.offsetTop;
              const height = el.offsetHeight;
              
              if (containerTop >= offset - 50 && containerTop < offset + height - 50) {
                  setActiveEmojiGroup(group.name);
                  break;
              }
          }
      }
  };

  // Sticker API Fetching (GIPHY)
  const fetchStickers = useCallback(async (query: string) => {
      setIsLoadingStickers(true);
      setStickerResults([]);
      
      try {
          const endpoint = query.trim() 
              ? `${GIPHY_BASE_URL}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=30&rating=g`
              : `${GIPHY_BASE_URL}/trending?api_key=${GIPHY_API_KEY}&limit=30&rating=g`;
              
          const response = await fetch(endpoint);
          
          if (response.ok) {
              const data = await response.json();
              const results = data.data.map((item: any) => ({
                  id: item.id,
                  // Use fixed_height for better loading performance, or original if needed
                  url: item.images?.original?.url || item.images?.fixed_height?.url,
                  title: item.title || 'Sticker'
              })).filter((item: any) => item.url);
              
              setStickerResults(results);
          } else {
              console.error("Giphy API Error", response.status);
          }
      } catch (error) {
          console.error("Failed to fetch stickers:", error);
      } finally {
          setIsLoadingStickers(false);
      }
  }, []);

  // Fetch trending stickers on mount
  useEffect(() => {
      if (view === 'EDITOR' && stickerTabMode === 'library' && stickerResults.length === 0) {
          fetchStickers("");
      }
  }, [view, stickerTabMode]);

  // Debounced search for stickers
  useEffect(() => {
      const timer = setTimeout(() => {
          if (view === 'EDITOR' && stickerTabMode === 'library') {
              fetchStickers(stickerSearch);
          }
      }, 500);
      return () => clearTimeout(timer);
  }, [stickerSearch, fetchStickers, view, stickerTabMode]);


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (selectedId && document.activeElement?.tagName !== 'TEXTAREA' && document.activeElement?.tagName !== 'INPUT') {
                removeLayer(selectedId);
            }
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            if (e.shiftKey) handleRedo();
            else handleUndo();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, historyIndex, history]);

  const handleMagicAnalysis = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    try {
      const captions = await generateMagicCaptions(image);
      setSuggestedCaptions(captions);
    } catch (error) {
      alert("Failed to generate captions.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRunAiEdit = async () => {
    if (!image || !editPrompt.trim()) return;
    setIsGeneratingEdit(true);
    setGeneratedEditImage(null);
    setEditError(null);
    try {
      const newImage = await editMemeImage(image, editPrompt);
      setGeneratedEditImage(newImage);
    } catch (error: any) {
      setEditError(error.message || "Failed to edit image.");
    } finally {
      setIsGeneratingEdit(false);
    }
  };

  const applyAiEdit = () => {
      if (generatedEditImage) {
          setImage(generatedEditImage);
          saveHistory(layers, generatedEditImage, imageFilter); 
          setShowEditModal(false);
          setGeneratedEditImage(null);
          setEditPrompt("");
          setEditError(null);
      }
  };

  const openFilterModal = () => {
      setPreviewFilter(imageFilter);
      setShowFilterModal(true);
  };

  const applyFilter = () => {
      setImageFilter(previewFilter);
      saveHistory(layers, image, previewFilter); // Save history with new filter
      setShowFilterModal(false);
  };

  const handleOpenDownloadModal = () => {
      if (canvasRef.current) {
          // Deselect items first to hide handles
          setSelectedId(null);
          // Small delay to let react update state if needed (though imperative handle does it inside too)
          setTimeout(() => {
             // Default to PNG for preview
             const dataUrl = canvasRef.current?.exportImage('image/png');
             const dims = canvasRef.current?.getDimensions() || { width: 0, height: 0 };
             setExportDimensions(dims);
             
             if (dataUrl) {
                 setFinalImagePreview(dataUrl);
                 setShowDownloadModal(true);
             }
          }, 50);
      }
  };

  // Update preview when format changes (mainly for JPG background handling)
  useEffect(() => {
      if (showDownloadModal && canvasRef.current) {
          const mime = exportFormat === 'png' ? 'image/png' : 'image/jpeg';
          // Note: toDataURL with quality only applies to JPEG/WEBP
          const dataUrl = canvasRef.current.exportImage(mime, exportQuality);
          setFinalImagePreview(dataUrl);
      }
  }, [exportFormat, exportQuality, showDownloadModal]);

  const handleDownload = () => {
      if (!finalImagePreview) return;
      
      const safeFilename = exportFilename.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'meme-studio';
      
      if (exportFormat === 'jpeg') {
          // Re-generate with specific quality for download
           if (canvasRef.current) {
               const jpgUrl = canvasRef.current.exportImage('image/jpeg', exportQuality);
               triggerDownload(jpgUrl, 'jpg', safeFilename);
           }
          return;
      }
      
      triggerDownload(finalImagePreview, 'png', safeFilename);
  };

  const triggerDownload = (url: string, ext: string, filename: string) => {
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleCopyClipboard = async () => {
      if (!canvasRef.current) return;
      try {
          // Clipboard API requires PNG
          const dataUrl = canvasRef.current.exportImage('image/png');
          const response = await fetch(dataUrl);
          const blob = await response.blob();
          await navigator.clipboard.write([
              new ClipboardItem({ [blob.type]: blob })
          ]);
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
          console.error("Failed to copy", err);
          alert("Failed to copy to clipboard");
      }
  };
  
  const handleShare = async () => {
       if (!canvasRef.current) return;
      try {
          const dataUrl = canvasRef.current.exportImage('image/png');
          const response = await fetch(dataUrl);
          const blob = await response.blob();
          const file = new File([blob], `${exportFilename}.png`, { type: blob.type });
          
          if (navigator.share) {
              await navigator.share({
                  title: 'Meme Studio Export',
                  text: 'Check out this meme I made!',
                  files: [file]
              });
          } else {
              alert("Sharing is not supported on this device. Use Download or Copy instead.");
          }
      } catch (err) {
           console.error("Share failed", err);
      }
  };

  const activeLayer = layers.find(l => l.id === selectedId);

  if (view === 'AI_GENERATOR') {
      return <AiGenerator onSelect={handleImageSelect} onBack={() => setView('HOME')} initialPrompt={aiStartPrompt} />;
  }

  return (
    <div className="min-h-screen flex flex-col pt-6 pb-10 overflow-x-hidden">
      <Header />
      
      {/* Magic Modal */}
      {showMagicModal && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
            <div className="fixed inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setShowMagicModal(false)}></div>
            <div className="relative w-full md:max-w-md bg-neutral-900 border-t md:border border-neutral-800 rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-fade-in-up">
                <div className="w-full flex justify-center pt-3 pb-1 md:hidden" onClick={() => setShowMagicModal(false)}>
                    <div className="w-12 h-1.5 bg-neutral-800 rounded-full"></div>
                </div>
                <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-900/50 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-neutral-800 rounded-lg"><Wand2 className="w-4 h-4 text-neutral-300" /></div>
                        <h3 className="text-sm font-semibold text-white">Magic Captions</h3>
                    </div>
                    <button onClick={() => setShowMagicModal(false)} className="text-neutral-500 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-5 overflow-y-auto space-y-5 custom-scrollbar pb-10 md:pb-5">
                    {suggestedCaptions.length === 0 && !isAnalyzing && (
                        <div className="flex justify-center py-4">
                            <Button variant="secondary" onClick={handleMagicAnalysis} className="w-full !bg-neutral-900 hover:!bg-neutral-800 !text-white border-neutral-800" icon={<Sparkles className="w-4 h-4" />}>Generate Ideas</Button>
                        </div>
                    )}
                    {isAnalyzing && (
                        <div className="py-8 text-center space-y-3">
                            <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto"></div>
                            <p className="text-xs text-neutral-400 animate-pulse">Analyzing humor potential...</p>
                        </div>
                    )}
                    {suggestedCaptions.length > 0 && !isAnalyzing && (
                        <div className="space-y-2">
                            {suggestedCaptions.map((cap, idx) => (
                                <button key={idx} onClick={() => { addText(cap); setShowMagicModal(false); }} className="w-full text-left p-3 text-sm text-neutral-200 bg-neutral-800 hover:bg-neutral-700 hover:text-white border border-neutral-700 rounded-xl transition-all">"{cap}"</button>
                            ))}
                            <div className="pt-4"><Button variant="secondary" onClick={handleMagicAnalysis} className="w-full text-xs" icon={<RotateCw className="w-3 h-3" />}>Regenerate</Button></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* AI Edit Modal */}
      {showEditModal && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black md:bg-transparent md:p-6 animate-fade-in-up">
              <div className="hidden md:block fixed inset-0 bg-black/95 backdrop-blur-md" onClick={() => setShowEditModal(false)}></div>
              <div className="relative w-full h-full md:h-[85vh] md:max-w-5xl bg-neutral-900 border-none md:border border-neutral-800 md:rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-neutral-800 bg-neutral-950/50 shrink-0 safe-top">
                      <div className="flex items-center gap-3">
                          <button onClick={() => setShowEditModal(false)} className="md:hidden p-2 -ml-2 text-neutral-400"><ArrowLeft className="w-5 h-5" /></button>
                          <div className="hidden md:block p-2 bg-neutral-800 rounded-xl"><Sparkles className="w-5 h-5 text-white" /></div>
                          <div><h3 className="text-base font-bold text-white">Generative Edit</h3></div>
                      </div>
                      <button onClick={() => setShowEditModal(false)} className="hidden md:block p-2 rounded-full hover:bg-neutral-800 text-neutral-500 hover:text-white"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                      <div className="flex-1 border-b md:border-b-0 md:border-r border-neutral-800 p-4 md:p-6 flex flex-col bg-neutral-950/30 min-h-0">
                          <span className="text-xs font-mono text-neutral-500 mb-2 uppercase tracking-wider block text-center">Original</span>
                          <div className="flex-1 flex items-center justify-center relative min-h-0"><img src={image!} className="max-w-full max-h-full object-contain rounded-lg" alt="Original" /></div>
                      </div>
                      <div className="flex-1 p-4 md:p-6 flex flex-col bg-black/20 relative min-h-0">
                           <span className="text-xs font-mono text-neutral-500 mb-2 uppercase tracking-wider block text-center">Result</span>
                           <div className="flex-1 flex items-center justify-center relative min-h-0 border border-dashed border-neutral-800 rounded-xl bg-neutral-900/20">
                                {editError ? (
                                    <div className="text-center px-6 py-4 max-w-md"><AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-3" /><p className="text-red-400 text-xs mb-4">{editError}</p><Button variant="ghost" onClick={() => setEditError(null)} className="text-xs h-8 text-red-200">Dismiss</Button></div>
                                ) : isGeneratingEdit ? (
                                    <div className="text-center"><div className="w-10 h-10 border-[3px] border-neutral-700 border-t-white rounded-full animate-spin mx-auto mb-4"></div><p className="text-xs text-neutral-500 animate-pulse">Processing...</p></div>
                                ) : generatedEditImage ? (
                                    <img src={generatedEditImage} className="max-w-full max-h-full object-contain rounded-lg" alt="Generated" />
                                ) : (
                                    <div className="text-neutral-600 text-sm flex flex-col items-center gap-2"><Sparkles className="w-8 h-8 opacity-20" /><p>Enter a prompt</p></div>
                                )}
                           </div>
                      </div>
                  </div>
                  <div className="p-4 md:p-6 bg-neutral-950 border-t border-neutral-800 flex flex-col gap-4 shrink-0 safe-bottom">
                      <div className="flex gap-3">
                          <input type="text" value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} placeholder="Describe changes..." className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:border-neutral-600 outline-none" onKeyDown={(e) => e.key === 'Enter' && handleRunAiEdit()} />
                          <Button variant="primary" onClick={handleRunAiEdit} disabled={!editPrompt.trim() || isGeneratingEdit} className="px-4 md:px-6 bg-white text-black">{isGeneratingEdit ? '...' : 'Generate'}</Button>
                      </div>
                      {generatedEditImage && (<div className="flex justify-end gap-3 pt-2 border-t border-neutral-800/50"><Button variant="ghost" onClick={() => setGeneratedEditImage(null)} className="text-neutral-400">Discard</Button><Button variant="secondary" onClick={applyAiEdit} className="text-green-500"><Check className="w-4 h-4 mr-2" /> Apply</Button></div>)}
                  </div>
              </div>
          </div>
      )}

      {/* Filter Modal */}
      {showFilterModal && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black md:bg-transparent md:p-6 animate-fade-in-up">
              <div className="hidden md:block fixed inset-0 bg-black/95 backdrop-blur-md" onClick={() => setShowFilterModal(false)}></div>
              <div className="relative w-full h-full md:h-[80vh] md:max-w-4xl bg-neutral-900 border-none md:border border-neutral-800 md:rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-neutral-800 bg-neutral-950/50 safe-top">
                      <div className="flex items-center gap-3">
                           <button onClick={() => setShowFilterModal(false)} className="md:hidden p-2 -ml-2 text-neutral-400"><ArrowLeft className="w-5 h-5" /></button>
                           <div><h3 className="text-base font-bold text-white">Filters</h3></div>
                      </div>
                      <button onClick={() => setShowFilterModal(false)} className="hidden md:block p-2 rounded-full hover:bg-neutral-800 text-neutral-500 hover:text-white"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="flex-1 flex flex-col overflow-hidden bg-black">
                      <div className="flex-1 flex items-center justify-center relative min-h-0 w-full h-full"><img src={image!} className="max-w-full max-h-full object-contain" style={{ filter: previewFilter }} alt="Preview" /></div>
                  </div>
                  <div className="p-6 bg-neutral-950 border-t border-neutral-800 flex flex-col gap-6 safe-bottom">
                      <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar px-2">
                          {FILTERS.map((filter) => (
                              <button key={filter.name} onClick={() => setPreviewFilter(filter.value)} className={`flex-shrink-0 px-4 py-3 md:py-2 rounded-xl md:rounded-lg text-sm md:text-xs font-medium border transition-all ${previewFilter === filter.value ? 'bg-white text-black border-white' : 'bg-neutral-900 text-neutral-400 border-neutral-800'}`}>{filter.name}</button>
                          ))}
                      </div>
                      <div className="flex justify-end gap-3"><Button variant="ghost" onClick={() => setShowFilterModal(false)} className="text-neutral-400 hidden md:flex">Cancel</Button><Button variant="secondary" onClick={applyFilter} className="w-full md:w-auto bg-white text-black border-none py-3 md:py-2"><Check className="w-4 h-4 mr-2" /> Apply Filter</Button></div>
                  </div>
              </div>
          </div>
      )}

      {/* Download Modal - Redesigned Responsive Split Layout */}
      {showDownloadModal && finalImagePreview && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 animate-fade-in-up">
              <div className="fixed inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowDownloadModal(false)}></div>
              
              {/* Responsive Modal Container: h-[90dvh] for mobile address bar safety */}
              <div className="relative w-full md:max-w-5xl h-[90dvh] md:h-[80vh] bg-neutral-900 rounded-t-3xl md:rounded-3xl border border-neutral-800 shadow-2xl overflow-hidden flex flex-col md:flex-row">
                  
                  {/* Close Button (Mobile Floating) */}
                  <button onClick={() => setShowDownloadModal(false)} className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/50 text-white md:hidden"><X className="w-5 h-5" /></button>

                  {/* Mobile Handle */}
                  <div className="w-full flex justify-center pt-3 pb-1 md:hidden bg-neutral-900 shrink-0" onClick={() => setShowDownloadModal(false)}>
                      <div className="w-12 h-1.5 bg-neutral-800 rounded-full"></div>
                  </div>

                  {/* Image Preview Section (Flexible on Mobile) */}
                  <div className="flex-1 bg-[#101010] flex items-center justify-center p-6 md:p-12 relative overflow-hidden min-h-0">
                       <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(45deg, #1a1a1a 25%, transparent 25%), linear-gradient(-45deg, #1a1a1a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1a1a1a 75%), linear-gradient(-45deg, transparent 75%, #1a1a1a 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px' }}></div>
                       <div className="relative z-10 w-full h-full flex items-center justify-center">
                           <img src={finalImagePreview} alt="Final Result" className="max-w-full max-h-full object-contain shadow-2xl rounded-lg border border-neutral-800" />
                       </div>
                  </div>

                  {/* Settings & Actions Section */}
                  <div className="w-full md:w-96 bg-neutral-950 border-t md:border-t-0 md:border-l border-neutral-800 flex flex-col shrink-0">
                      
                      {/* Header (Desktop Only) */}
                      <div className="hidden md:flex p-6 border-b border-neutral-800 items-center justify-between shrink-0">
                          <h3 className="text-lg font-bold text-white">Export Settings</h3>
                          <button onClick={() => setShowDownloadModal(false)} className="text-neutral-500 hover:text-white"><X className="w-5 h-5" /></button>
                      </div>

                      {/* Settings Content (Scrollable) */}
                      <div className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto max-h-[35vh] md:max-h-none">
                          
                          {/* Info Badge */}
                          <div className="flex gap-4 p-3 bg-neutral-900 rounded-xl border border-neutral-800">
                              <div className="p-2 bg-neutral-800 rounded-lg"><Monitor className="w-4 h-4 text-neutral-400" /></div>
                              <div>
                                  <p className="text-xs text-neutral-500 uppercase">Dimensions</p>
                                  <p className="text-sm font-mono text-neutral-200">{exportDimensions.width} x {exportDimensions.height} px</p>
                              </div>
                          </div>

                          {/* File Name Input */}
                          <div className="space-y-2">
                              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">File Name</label>
                              <input 
                                type="text" 
                                value={exportFilename}
                                onChange={(e) => setExportFilename(e.target.value)}
                                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:border-neutral-600 outline-none transition-colors"
                                placeholder="meme-name"
                              />
                          </div>

                          {/* Format Selection */}
                          <div className="space-y-2">
                              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Format</label>
                              <div className="grid grid-cols-2 gap-3">
                                  <button 
                                    onClick={() => setExportFormat('png')}
                                    className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border transition-all ${exportFormat === 'png' ? 'bg-neutral-800 border-white text-white ring-1 ring-white/20' : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800'}`}
                                  >
                                      <span className="text-sm font-bold">PNG</span>
                                      <span className="text-[10px] opacity-60">Lossless</span>
                                  </button>
                                  <button 
                                    onClick={() => setExportFormat('jpeg')}
                                    className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border transition-all ${exportFormat === 'jpeg' ? 'bg-neutral-800 border-white text-white ring-1 ring-white/20' : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800'}`}
                                  >
                                      <span className="text-sm font-bold">JPG</span>
                                      <span className="text-[10px] opacity-60">Compressed</span>
                                  </button>
                              </div>
                          </div>

                          {/* Quality Slider (Only for JPG) */}
                          {exportFormat === 'jpeg' && (
                              <div className="space-y-3 animate-fade-in-up">
                                  <div className="flex justify-between">
                                      <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Quality</label>
                                      <span className="text-xs font-mono text-neutral-400">{Math.round(exportQuality * 100)}%</span>
                                  </div>
                                  <input 
                                    type="range" 
                                    min="0.1" 
                                    max="1" 
                                    step="0.1" 
                                    value={exportQuality} 
                                    onChange={(e) => setExportQuality(parseFloat(e.target.value))}
                                    className="w-full accent-white h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                                  />
                              </div>
                          )}
                      </div>

                      {/* Actions Footer (Sticky) */}
                      <div className="p-6 border-t border-neutral-800 space-y-3 bg-neutral-900/90 backdrop-blur-md md:backdrop-blur-none safe-bottom">
                          <Button onClick={handleDownload} className="w-full py-4 bg-white text-black hover:bg-neutral-200 rounded-xl text-sm font-bold shadow-lg shadow-white/10 border-none">
                              Download Image
                          </Button>
                          <div className="flex gap-3">
                              <Button 
                                variant="secondary" 
                                onClick={handleCopyClipboard} 
                                className={`flex-1 py-3 border-neutral-700 text-xs transition-all duration-300 ${copySuccess ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-neutral-800 hover:bg-neutral-700'}`}
                              >
                                  {copySuccess ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />} 
                                  {copySuccess ? 'Copied!' : 'Copy'}
                              </Button>
                              <Button variant="secondary" onClick={handleShare} className="flex-1 py-3 bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-xs">
                                  <Share2 className="w-4 h-4 mr-2" /> Share
                              </Button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 flex flex-col">
        {view === 'HOME' ? (
          <div className="flex-1 flex flex-col justify-center items-center">
            <div className="text-center mb-12 animate-fade-in-up">
              <h2 className="text-5xl font-bold mb-6 tracking-tight text-white">MemeGen<span className="text-indigo-500">.ai</span></h2>
              <p className="text-neutral-400 text-lg max-w-lg mx-auto leading-relaxed">The next-gen meme studio.</p>
            </div>
            <ImageUploader onImageSelect={handleImageSelect} onAiGenerateClick={handleNavigateToAi}/>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 h-full animate-fade-in-up relative">
            {/* Left: Canvas */}
            <div className="flex-1 flex flex-col">
               <div className="mb-6 flex justify-between items-center">
                 <button onClick={() => { setImage(null); setView('HOME'); }} className="group flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm font-medium">
                   <div className="p-1 rounded-full bg-neutral-800 group-hover:bg-neutral-700 transition-colors"><ArrowLeft className="w-4 h-4" /></div>Back to home
                 </button>
                 <div className="flex gap-2">
                    <Button variant="secondary" onClick={handleUndo} disabled={historyIndex <= 0} className="!p-2"><Undo className="w-4 h-4"/></Button>
                    <Button variant="secondary" onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="!p-2"><Redo className="w-4 h-4"/></Button>
                 </div>
               </div>
               
               <div className="flex-1 flex flex-col items-center justify-center bg-neutral-900/30 rounded-3xl border border-neutral-800/50 backdrop-blur-sm p-4 sm:p-8 min-h-[60vh]">
                  <MemeCanvas 
                    ref={canvasRef}
                    image={image!} 
                    layers={layers} 
                    filter={imageFilter}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    onUpdate={updateLayer}
                    onInteractionEnd={() => saveHistory(layers)}
                  />
               </div>
               
               {/* Download Button Area - Renamed Button */}
               <div className="mt-6 flex justify-center animate-fade-in-up pb-6 md:pb-0">
                   <button 
                     onClick={handleOpenDownloadModal}
                     className="group relative px-8 py-3 bg-white text-black font-bold rounded-full overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all active:scale-95"
                   >
                       <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                       <div className="flex items-center gap-2 relative z-10">
                           <Download className="w-5 h-5" />
                           <span>Download</span>
                       </div>
                   </button>
               </div>
            </div>

            {/* Right: Tools Panel */}
            <div className="w-full lg:w-96 bg-neutral-900/80 backdrop-blur-md border border-neutral-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl h-fit sticky top-10 mb-10 lg:mb-0">
              <div className="flex p-2 bg-neutral-950/50 border-b border-neutral-800">
                {[
                  { id: Tab.CAPTION, icon: Type, label: 'Layers' },
                  { id: Tab.STICKER, icon: StickerIcon, label: 'Stickers' },
                  { id: Tab.EDIT, icon: Edit, label: 'Edit' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as Tab)}
                    className={`flex-1 py-3 text-xs font-medium flex flex-col items-center gap-1.5 rounded-xl transition-all duration-300 ${activeTab === tab.id ? 'bg-neutral-800 text-white shadow-lg' : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50'}`}
                  >
                    <tab.icon className="w-4 h-4" />{tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6 min-h-[400px]">
                {/* LAYERS / TEXT TAB */}
                {activeTab === Tab.CAPTION && (
                  <div className="space-y-6 animate-fade-in-up">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium text-neutral-300">Stack</h3>
                        <div className="flex gap-2">
                             {layers.length > 0 && (
                                <Button variant="ghost" onClick={resetAllLayers} className="!py-1.5 !px-2 text-[10px] text-neutral-500 hover:text-white">Reset All</Button>
                             )}
                             <Button variant="ghost" onClick={() => setShowMagicModal(true)} className="!py-1.5 !px-3 text-xs border border-neutral-700 bg-neutral-800"><Wand2 className="w-3 h-3 mr-1.5" /> Magic</Button>
                             <Button variant="ghost" onClick={() => addText()} className="!py-1.5 !px-3 text-xs border border-neutral-700 bg-neutral-800"><Plus className="w-3 h-3 mr-1" /> Add Text</Button>
                        </div>
                    </div>
                    
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                        {[...layers].reverse().map((layer) => {
                            const actualIndex = layers.findIndex(l => l.id === layer.id);
                            const isTop = actualIndex === layers.length - 1;
                            const isBottom = actualIndex === 0;
                            const isSelected = selectedId === layer.id;

                            return (
                                <div key={layer.id} onClick={() => setSelectedId(layer.id)} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 group ${isSelected ? 'bg-neutral-800 border-neutral-500 shadow-lg' : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'}`}>
                                    <div className="w-10 h-10 shrink-0 rounded-lg flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] bg-neutral-900 border border-neutral-800 overflow-hidden relative">
                                        {layer.type === 'text' ? (
                                            <Type className="w-5 h-5 text-neutral-500" />
                                        ) : (
                                            <img src={(layer as MemeSticker).url} alt="layer-preview" className="w-full h-full object-contain" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-neutral-300 truncate">
                                            {layer.type === 'text' ? (layer as MemeText).content.replace(/\n/g, ' ') : 'Sticker'}
                                        </p>
                                        <p className="text-[10px] text-neutral-600 uppercase tracking-wide">{layer.type}</p>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-900/80 rounded-lg p-1 backdrop-blur-sm">
                                        <button onClick={(e) => { e.stopPropagation(); moveLayer(layer.id, 'up'); }} disabled={isTop} className="p-1.5 text-neutral-500 hover:text-white disabled:opacity-20 hover:bg-neutral-700 rounded"><ChevronUp className="w-3 h-3" /></button>
                                        <button onClick={(e) => { e.stopPropagation(); moveLayer(layer.id, 'down'); }} disabled={isBottom} className="p-1.5 text-neutral-500 hover:text-white disabled:opacity-20 hover:bg-neutral-700 rounded"><ChevronDown className="w-3 h-3" /></button>
                                        <button onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }} className="text-neutral-600 hover:text-red-400 p-1.5 ml-1"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                </div>
                            );
                        })}
                        {layers.length === 0 && (
                            <div className="p-6 text-center text-neutral-600 border border-dashed border-neutral-800 rounded-xl text-sm">No layers added yet.</div>
                        )}
                    </div>

                    {activeLayer && activeLayer.type === 'text' && (
                        <div className="pt-4 border-t border-neutral-800 space-y-4 animate-fade-in-up">
                            <div className="flex justify-between items-center">
                                <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Text Options</h4>
                                <button onClick={() => resetLayerPosition(activeLayer.id)} className="text-[10px] bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white px-2 py-1 rounded flex items-center gap-1 transition-colors"><LayoutTemplate className="w-3 h-3" /> Reset</button>
                            </div>
                            <textarea value={(activeLayer as MemeText).content} onChange={(e) => updateLayer(activeLayer.id, { content: e.target.value })} onBlur={() => saveHistory(layers)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm focus:border-neutral-500 outline-none resize-none text-white" rows={2} />
                            <div className="relative">
                                <select value={(activeLayer as MemeText).fontFamily} onChange={(e) => { updateLayer(activeLayer.id, { fontFamily: e.target.value }); saveHistory(layers); }} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-sm text-white outline-none appearance-none focus:border-neutral-500 cursor-pointer">
                                    {FONTS.map(font => (<option key={font.name} value={font.name}>{font.label}</option>))}
                                </select>
                                <FontIcon className="absolute right-3 top-3 w-4 h-4 text-neutral-500 pointer-events-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs text-neutral-500">Size</label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-neutral-300 font-mono">{(activeLayer as MemeText).fontSize.toFixed(2)}px</span>
                                            <button onClick={() => updateLayer(activeLayer.id, { fontSize: 40 })} className="p-1 hover:text-white text-neutral-600"><RotateCcw className="w-3 h-3"/></button>
                                        </div>
                                    </div>
                                    <input type="range" min="10" max="200" step="0.1" value={(activeLayer as MemeText).fontSize} onChange={(e) => updateLayer(activeLayer.id, { fontSize: parseFloat(e.target.value) })} onMouseUp={() => saveHistory(layers)} className="w-full accent-white h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer block" />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs text-neutral-500">Rotate</label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-neutral-300 font-mono">{(((activeLayer as MemeText).rotation * 180) / Math.PI).toFixed(2)}°</span>
                                            <button onClick={() => updateLayer(activeLayer.id, { rotation: 0 })} className="p-1 hover:text-white text-neutral-600"><RotateCcw className="w-3 h-3"/></button>
                                        </div>
                                    </div>
                                    <input type="range" min="-180" max="180" step="0.1" value={((activeLayer as MemeText).rotation * 180) / Math.PI} onChange={(e) => updateLayer(activeLayer.id, { rotation: (parseFloat(e.target.value) * Math.PI) / 180 })} onMouseUp={() => saveHistory(layers)} className="w-full accent-white h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer block" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs text-neutral-500">Width</label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-neutral-300 font-mono">{(activeLayer as MemeText).boxWidth.toFixed(2)}px</span>
                                        <button onClick={() => updateLayer(activeLayer.id, { boxWidth: 400 })} className="p-1 hover:text-white text-neutral-600"><RotateCcw className="w-3 h-3"/></button>
                                    </div>
                                </div>
                                <input type="range" min="100" max="800" step="0.1" value={(activeLayer as MemeText).boxWidth} onChange={(e) => updateLayer(activeLayer.id, { boxWidth: parseFloat(e.target.value) })} onMouseUp={() => saveHistory(layers)} className="w-full accent-white h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer block" />
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex bg-neutral-950 rounded-lg border border-neutral-800 p-1">
                                    {(['left', 'center', 'right'] as const).map((align) => (
                                        <button key={align} onClick={() => { updateLayer(activeLayer.id, { textAlign: align }); saveHistory(layers); }} className={`p-2 rounded-md transition-colors ${(activeLayer as MemeText).textAlign === align ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-300'}`}>
                                            {align === 'left' && <AlignLeft className="w-4 h-4"/>}{align === 'center' && <AlignCenter className="w-4 h-4"/>}{align === 'right' && <AlignRight className="w-4 h-4"/>}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex-1 h-10 rounded-lg border border-neutral-800 bg-neutral-950 flex items-center px-2 relative">
                                    <div className="w-full h-6 rounded overflow-hidden border border-neutral-700/50" style={{ backgroundColor: (activeLayer as MemeText).color }}></div>
                                    <input type="color" value={(activeLayer as MemeText).color} onChange={(e) => updateLayer(activeLayer.id, { color: e.target.value })} onBlur={() => saveHistory(layers)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeLayer && activeLayer.type === 'sticker' && (
                         <div className="pt-4 border-t border-neutral-800 space-y-4 animate-fade-in-up">
                             <div className="flex justify-between items-center">
                                <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Sticker Options</h4>
                                <button onClick={() => resetLayerPosition(activeLayer.id)} className="text-[10px] bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white px-2 py-1 rounded flex items-center gap-1 transition-colors"><LayoutTemplate className="w-3 h-3" /> Reset</button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs text-neutral-500 flex items-center gap-1"><Maximize className="w-3 h-3"/> Size</label>
                                        <button onClick={() => {
                                            const ratio = (activeLayer as MemeSticker).width / (activeLayer as MemeSticker).height;
                                            updateLayer(activeLayer.id, { width: 200, height: 200 / ratio });
                                        }} className="p-1 hover:text-white text-neutral-600"><RotateCcw className="w-3 h-3"/></button>
                                    </div>
                                    {/* Scaling width/height proportionally */}
                                    <input type="range" min="50" max="600" step="0.1" value={(activeLayer as MemeSticker).width} 
                                        onChange={(e) => { 
                                            const newWidth = parseFloat(e.target.value);
                                            const aspectRatio = (activeLayer as MemeSticker).width / (activeLayer as MemeSticker).height;
                                            updateLayer(activeLayer.id, { width: newWidth, height: newWidth / aspectRatio });
                                        }} 
                                        onMouseUp={() => saveHistory(layers)} 
                                        className="w-full accent-white h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer block" 
                                    />
                                    <div className="text-right">
                                         <span className="text-xs text-neutral-300 font-mono">{(activeLayer as MemeSticker).width.toFixed(2)}px</span>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs text-neutral-500 flex items-center gap-1"><RotateCw className="w-3 h-3"/> Rotate</label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-neutral-300 font-mono">{(((activeLayer as MemeSticker).rotation * 180) / Math.PI).toFixed(2)}°</span>
                                            <button onClick={() => updateLayer(activeLayer.id, { rotation: 0 })} className="p-1 hover:text-white text-neutral-600"><RotateCcw className="w-3 h-3"/></button>
                                        </div>
                                    </div>
                                    <input type="range" min="-180" max="180" step="0.1" value={((activeLayer as MemeSticker).rotation * 180) / Math.PI} onChange={(e) => updateLayer(activeLayer.id, { rotation: (parseFloat(e.target.value) * Math.PI) / 180 })} onMouseUp={() => saveHistory(layers)} className="w-full accent-white h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer block" />
                                </div>
                            </div>

                            <div className="space-y-1.5 pt-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs text-neutral-500 flex items-center gap-1"><Move className="w-3 h-3"/> Position (X/Y)</label>
                                    <button onClick={() => updateLayer(activeLayer.id, { x: 50, y: 50 })} className="p-1 hover:text-white text-neutral-600"><RotateCcw className="w-3 h-3"/></button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                     <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1">
                                         <span className="text-[10px] text-neutral-500">X</span>
                                         <input type="number" step="0.01" value={activeLayer.x.toFixed(2)} onChange={(e) => updateLayer(activeLayer.id, { x: parseFloat(e.target.value) })} className="w-full bg-transparent text-xs text-white outline-none text-right" />
                                     </div>
                                     <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1">
                                         <span className="text-[10px] text-neutral-500">Y</span>
                                         <input type="number" step="0.01" value={activeLayer.y.toFixed(2)} onChange={(e) => updateLayer(activeLayer.id, { y: parseFloat(e.target.value) })} className="w-full bg-transparent text-xs text-white outline-none text-right" />
                                     </div>
                                </div>
                            </div>
                         </div>
                    )}
                  </div>
                )}

                {/* STICKER TAB */}
                {activeTab === Tab.STICKER && (
                    <div className="flex flex-col h-full max-h-[600px] animate-fade-in-up">
                        {/* Top Navigation */}
                        <div className="flex p-1 bg-neutral-950 border border-neutral-800 rounded-xl mb-4 shrink-0">
                            <button onClick={() => setStickerTabMode('library')} className={`flex-1 py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${stickerTabMode === 'library' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-300'}`}>
                                <Shapes className="w-3.5 h-3.5" /> Stickers
                            </button>
                            <button onClick={() => setStickerTabMode('emoji')} className={`flex-1 py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${stickerTabMode === 'emoji' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-300'}`}>
                                <Smile className="w-3.5 h-3.5" /> Emoji
                            </button>
                        </div>

                        {stickerTabMode === 'library' ? (
                            // API Sticker Library View
                            <>
                                <div className="relative mb-3 shrink-0">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                                    <input 
                                        type="text" 
                                        placeholder="Search GIPHY stickers..." 
                                        value={stickerSearch}
                                        onChange={(e) => setStickerSearch(e.target.value)}
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-neutral-600 focus:border-neutral-600 outline-none"
                                    />
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-[300px]">
                                    {isLoadingStickers ? (
                                        <div className="flex flex-col items-center justify-center h-32 gap-2">
                                            <Loader2 className="w-6 h-6 text-neutral-500 animate-spin" />
                                            <span className="text-xs text-neutral-500">Fetching stickers...</span>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-3 gap-3 pb-4">
                                            {stickerResults.map((asset) => (
                                                <button 
                                                    key={asset.id}
                                                    onClick={() => addSticker(asset.url)}
                                                    className="group relative aspect-square bg-neutral-900 border border-neutral-800 rounded-xl hover:border-neutral-500 transition-all overflow-hidden"
                                                >
                                                    <div className="absolute inset-0 p-2 flex items-center justify-center">
                                                        <img src={getProxiedUrl(asset.url)} alt={asset.title} className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-110" loading="lazy" />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {!isLoadingStickers && stickerResults.length === 0 && (
                                        <div className="flex flex-col items-center justify-center h-32 text-neutral-500 text-xs">
                                            <Search className="w-6 h-6 mb-2 opacity-20" />
                                            No stickers found
                                        </div>
                                    )}
                                </div>
                                
                                {/* Powered by attribution */}
                                <div className="pt-2 text-center">
                                    <span className="text-[10px] text-neutral-600">Powered by GIPHY</span>
                                </div>
                            </>
                        ) : (
                            // iOS Style Emoji Picker
                            <div className="flex flex-col h-full overflow-hidden relative bg-neutral-950/30 rounded-xl border border-neutral-800/50">
                                {/* Scrollable Emoji Area */}
                                <div 
                                    ref={emojiContainerRef} 
                                    onScroll={handleEmojiScroll}
                                    className="flex-1 overflow-y-auto custom-scrollbar pr-1 scroll-smooth pb-12"
                                >
                                    <div className="px-2 pt-2">
                                         {/* Frequently Used Placeholder */}
                                        <div className="mb-4">
                                            <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2 sticky top-0 bg-neutral-900/95 backdrop-blur z-10 py-1">Frequently Used</h4>
                                            <div className="grid grid-cols-8 sm:grid-cols-10 gap-0.5">
                                                {["😂","😭","❤️","🔥","🙏","👀","✨"].map((emoji) => (
                                                    <button 
                                                        key={emoji}
                                                        onClick={() => addSticker(emojiToDataURL(emoji))}
                                                        className="aspect-square flex items-center justify-center text-2xl hover:bg-white/5 rounded-md transition-colors active:scale-90"
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {EMOJI_GROUPS.map((group) => (
                                            <div 
                                                key={group.name} 
                                                className="mb-4"
                                                ref={el => { emojiGroupsRef.current[group.name] = el; }}
                                            >
                                                <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2 sticky top-0 bg-neutral-900/95 backdrop-blur z-10 py-1 border-b border-white/5">{group.name}</h4>
                                                <div className="grid grid-cols-8 sm:grid-cols-10 gap-0.5">
                                                    {group.emojis.map((emoji) => (
                                                        <button 
                                                            key={emoji}
                                                            onClick={() => addSticker(emojiToDataURL(emoji))}
                                                            className="aspect-square flex items-center justify-center text-2xl hover:bg-white/5 rounded-md transition-colors active:scale-90 cursor-pointer"
                                                        >
                                                            <span className="leading-none">{emoji}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Bottom Tab Bar (iOS Style) */}
                                <div className="absolute bottom-0 left-0 right-0 bg-neutral-900/95 backdrop-blur border-t border-neutral-800 flex justify-between items-center px-2 py-1.5 z-20">
                                    <button className="p-2 rounded-lg text-neutral-600 hover:text-neutral-400"><Clock className="w-5 h-5" /></button>
                                    {EMOJI_GROUPS.map(group => (
                                        <button 
                                            key={group.name}
                                            onClick={() => scrollToEmojiGroup(group.name)}
                                            className={`p-2 rounded-lg transition-all flex-shrink-0 ${activeEmojiGroup === group.name ? 'text-blue-500 bg-blue-500/10' : 'text-neutral-600 hover:text-neutral-400'}`}
                                            title={group.name}
                                        >
                                            {group.icon}
                                        </button>
                                    ))}
                                    <button className="p-2 rounded-lg text-neutral-600 hover:text-neutral-400"><Circle className="w-5 h-5 text-neutral-700" /></button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* EDIT TAB */}
                {activeTab === Tab.EDIT && (
                  <div className="space-y-6 animate-fade-in-up">
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Generative AI</h3>
                        <button onClick={() => setShowEditModal(true)} className="w-full p-4 rounded-xl bg-neutral-800/30 border border-neutral-800 hover:border-neutral-600 hover:bg-neutral-800/50 transition-all group flex items-center gap-4">
                            <div className="p-2.5 bg-neutral-900 border border-neutral-700/50 rounded-lg text-neutral-400 group-hover:text-white transition-colors"><Sparkles className="w-5 h-5" /></div>
                            <div className="text-left"><h4 className="text-sm font-semibold text-white">Magic Edit</h4><p className="text-[11px] text-neutral-400 leading-tight mt-0.5">Remix this image with a text prompt</p></div>
                        </button>
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Image Adjustments</h3>
                        <button onClick={openFilterModal} className="w-full p-4 rounded-xl bg-neutral-800/30 border border-neutral-800 hover:border-neutral-600 hover:bg-neutral-800/50 transition-all group flex items-center gap-4">
                            <div className="p-2.5 bg-neutral-900 border border-neutral-700/50 rounded-lg text-neutral-400 group-hover:text-white transition-colors"><Palette className="w-5 h-5" /></div>
                            <div className="text-left"><h4 className="text-sm font-semibold text-white">Filters & Effects</h4><p className="text-[11px] text-neutral-400 leading-tight mt-0.5">Apply color grading and styles</p></div>
                        </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
