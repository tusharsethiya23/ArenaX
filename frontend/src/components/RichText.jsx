// RichText.jsx
// Post text with #hashtags and @mentions highlighted. Text is rendered as
// React text nodes (never as HTML), so user content can't inject markup.

const TOKEN = /([#@][\p{L}\p{N}_]+)/gu;

const RichText = ({ text, className = '' }) => (
    <p className={`whitespace-pre-wrap break-words ${className}`}>
        {text.split(TOKEN).map((part, i) =>
            i % 2 === 1
                ? <span key={i} className="font-medium text-sky-300">{part}</span>
                : part
        )}
    </p>
);

export default RichText;
