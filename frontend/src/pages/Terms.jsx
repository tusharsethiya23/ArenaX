// Terms.jsx
// Public Terms of Service (/terms).

import { Link } from 'react-router-dom';
import LegalPage, { Section, Contact } from '../components/LegalPage';

const Terms = () => (
    <LegalPage title="Terms of Service">
        <p>
            These terms apply when you use ArenaX. By creating an account or using the app, you agree to them.
        </p>

        <Section title="Your account">
            <ul>
                <li>Give accurate information, and keep your password safe. You're responsible for what happens on your account.</li>
                <li>You must be at least 13 to use ArenaX. If you are under 18, use it with a parent or guardian's permission.</li>
                <li>One person, one account. Don't pretend to be someone else.</li>
            </ul>
        </Section>

        <Section title="What you post">
            <ul>
                <li>You own what you post. You allow ArenaX to show it in the app so the features work.</li>
                <li>Don't post anything illegal, hateful, harassing, sexual, or that you don't have the right to share.</li>
                <li>Achievements and endorsements must be true. Coaches should only verify achievements they know are real.</li>
                <li>We may remove content or suspend accounts that break these rules.</li>
            </ul>
        </Section>

        <Section title="Coaches and sessions">
            <ul>
                <li>Coaches are independent and are not employed by ArenaX. ArenaX helps you find and book them but isn't part of the training itself.</li>
                <li>Coaches are responsible for the sessions they run. Athletes should train within their limits and seek medical advice for injuries.</li>
                <li>Please cancel or reschedule early if you can't make a session.</li>
            </ul>
        </Section>

        <Section title="AI coach and Athlete DNA">
            <p>
                AI coach answers and Athlete DNA scores are guidance, not professional, medical or guaranteed advice.
                Always use your own judgement and talk to a qualified professional about pain, injury or health.
            </p>
        </Section>

        <Section title="Availability and liability">
            <p>
                ArenaX is provided as it is. We work to keep it running and accurate but can't promise it will always be
                available or error-free. As far as the law allows, ArenaX isn't liable for indirect losses, or for what
                happens in sessions between athletes and coaches.
            </p>
        </Section>

        <Section title="Privacy">
            <p>How we handle your information is explained in our <Link to="/privacy" className="font-semibold text-ink underline">Privacy Policy</Link>.</p>
        </Section>

        <Section title="Changes and contact">
            <p>
                If we change these terms, we'll update the date at the top. You can stop using ArenaX and delete your
                account at any time. For questions, <Contact />.
            </p>
        </Section>
    </LegalPage>
);

export default Terms;
