import { greetingWord } from '../../lib/time';
import { useNow } from '../../lib/useNow';
import { useSettings } from '../../store/settings';

export function Greeting() {
  const name = useSettings((state) => state.settings.profile.name.trim());
  const now = useNow(60000);
  const word = greetingWord(now);

  if (word === 'night') {
    return (
      <p className="greeting">
        {name ? 'Still awake, ' : 'Still '}
        <span className="greeting__accent">{name || 'awake'}</span>?
      </p>
    );
  }

  if (name) {
    return (
      <p className="greeting">
        Good {word}, <span className="greeting__accent">{name}</span>.
      </p>
    );
  }

  return (
    <p className="greeting">
      Good <span className="greeting__accent">{word}</span>.
    </p>
  );
}
