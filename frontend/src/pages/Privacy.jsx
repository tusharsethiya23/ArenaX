// Privacy.jsx
// Public Privacy Policy (/privacy). Describes what ArenaX actually stores and
// shares; update it when features that touch personal data change.

import LegalPage, { Section, Contact } from '../components/LegalPage';

const Privacy = () => (
    <LegalPage title="Privacy Policy">
        <p>
            ArenaX connects athletes with coaches, and athletes and coaches with brands. This policy explains what
            information we collect when you use ArenaX, how we use it, and the choices you have.
        </p>

        <Section title="Information we collect">
            <ul>
                <li><b>Account details:</b> your name, email address, role (learner or coach) and a password, which we store only in hashed form.</li>
                <li><b>Google sign-in:</b> if you choose "Continue with Google", Google shares your name, email address and profile photo with us. We don't receive your Google password or access to anything else in your Google account.</li>
                <li><b>Profile information you add:</b> photo, bio, city, sport, skill level, goals, and for coaches: price, experience, weekly availability and focus skills.</li>
                <li><b>Things you create:</b> posts, photos, comments, likes, saved posts, follows, endorsements, reviews and portfolio achievements.</li>
                <li><b>Sessions:</b> bookings with coaches (dates, times and status) and the chat messages sent within a booking.</li>
                <li><b>Athlete DNA:</b> skill ratings from you and from coaches you have trained with, your career goal, and the training activities you log.</li>
                <li><b>AI coach:</b> the questions you ask the AI coach.</li>
                <li><b>Usage:</b> basic records such as who viewed a coach's profile, used to show coaches their statistics.</li>
            </ul>
        </Section>

        <Section title="How we use it">
            <ul>
                <li>To run your account and show your profile, posts and portfolio to other users.</li>
                <li>To book sessions, send session updates and let you chat with your coach or athlete.</li>
                <li>To work out your Athlete DNA scores, plan and readiness, and to recommend coaches that match your goals.</li>
                <li>To answer your questions with the AI coach.</li>
                <li>To let brands find athletes who have made their profile public and reached a high readiness score.</li>
                <li>To keep ArenaX safe, prevent abuse and fix problems.</li>
            </ul>
            <p>We do not sell your personal information, and we do not use it for advertising.</p>
        </Section>

        <Section title="Who can see your information">
            <ul>
                <li><b>Other users</b> can see your public profile, posts, portfolio and follower counts. If your account is private, only approved followers see your posts.</li>
                <li><b>Coaches you have trained with</b> can see and add to your Athlete DNA. Other users can't.</li>
                <li><b>Brands</b> using ArenaX can find public athlete profiles that meet a readiness level.</li>
                <li><b>Chat messages</b> are visible only to the two people in that booking.</li>
            </ul>
        </Section>

        <Section title="Services we use">
            <p>We rely on a few providers to run ArenaX. They process data only to provide their service to us:</p>
            <ul>
                <li><b>Render</b> hosts the app and the server.</li>
                <li><b>MongoDB Atlas</b> stores the app's database.</li>
                <li><b>ImageKit</b> stores the photos you upload.</li>
                <li><b>Google</b> provides "Continue with Google" sign-in, and Google Gemini answers AI coach questions. Your question and relevant profile and DNA details are sent to Gemini to produce an answer.</li>
            </ul>
            <p>ArenaX doesn't process real payments yet, so we don't collect card or bank details.</p>
        </Section>

        <Section title="How long we keep it">
            <p>
                We keep your information while your account exists. When you delete your account in Settings, we delete
                your account and everything linked to it: your profile, posts, comments, likes, saved posts, follows,
                bookings and their chat messages, reviews, endorsements, portfolio achievements, Athlete DNA and logged
                activities.
            </p>
            <p>
                If you were a coach who verified someone's achievement, it stays verified but is shown as verified by
                "a former coach". Photo files you uploaded may remain with our image storage provider; to have those
                removed too, <Contact />.
            </p>
        </Section>

        <Section title="Your choices">
            <ul>
                <li>Edit your profile at any time in Settings.</li>
                <li>Make your account private so only approved followers see your posts.</li>
                <li>Delete posts, achievements and logged activities you have added.</li>
                <li>Delete your account in Settings.</li>
            </ul>
            <p>To ask for a copy of your data or for anything else about your privacy, <Contact />.</p>
        </Section>

        <Section title="Children">
            <p>
                ArenaX is not meant for children under 13. If you are under 18, please use ArenaX with the permission
                of a parent or guardian.
            </p>
        </Section>

        <Section title="Changes to this policy">
            <p>If we change this policy, we'll update the date at the top of this page.</p>
        </Section>
    </LegalPage>
);

export default Privacy;
