import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Prophetic Insights: Discernment for Modern Believers | Daily Manna AI",
  description: "Dive deep into prophetic insights and biblical revelations. Understand how ancient prophecies align with modern times and what God is speaking to the church today.",
};

export default function PropheticInsights() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl text-white">
      <h1 className="text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
        Prophetic Insights: Understanding the Times
      </h1>
      <p className="mb-6 text-gray-300 text-lg leading-relaxed">
        In an ever-changing and unpredictable world, believers often seek deeper clarity on the spiritual climate and God’s overarching plan. Prophetic insights provide us with a lens to view current events through a biblical framework, reminding us that God is still actively stirring the hearts of His people.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-200">The Role of Prophecy Today</h2>
      <p className="mb-6 text-gray-300 leading-relaxed">
        Prophecy is not primarily about predicting the future like a fortune-teller; rather, it is about forth-telling the heart and mind of God. 1 Corinthians 14:3 clarifies that &quot;the one who prophesies speaks to people for their strengthening, encouraging and comfort.&quot;
      </p>
      <p className="mb-6 text-gray-300 leading-relaxed">
        Today’s prophetic insights help the church navigate seasons of cultural shifting. They act as a spiritual compass, bringing believers back to repentance, worship, and missional living. 
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-200">Discerning the True from the False</h2>
      <p className="mb-4 text-gray-300">
        With an abundance of voices claiming prophetic authority, discernment is crucial. 
      </p>
      
      <ul className="list-disc pl-6 mb-8 text-gray-300 space-y-3">
        <li>
          <strong className="text-white">Aligns with Scripture:</strong> A true prophetic word will never contradict the Bible. God&apos;s Word is the ultimate measuring stick.
        </li>
        <li>
          <strong className="text-white">Bears Good Fruit:</strong> Does the insight bring peace, conviction, and a desire to draw closer to Christ? Or does it instill panic and confusion? 
        </li>
        <li>
          <strong className="text-white">Exalts Jesus:</strong> Revelation 19:10 reminds us that &quot;the testimony of Jesus is the spirit of prophecy.&quot; True insights always magnify Christ, not the messenger.
        </li>
      </ul>

      <div className="mt-10 p-6 bg-slate-800 rounded-lg border border-slate-700 shadow-xl">
        <h2 className="text-xl font-semibold mb-3 text-blue-300">Preparing for What&apos;s Next</h2>
        <p className="text-gray-200">
          As we tune into these spiritual insights, our response should be one of readiness. Like the five wise virgins (Matthew 25), we must keep our lamps full of oil—spending time in intimacy with God, loving our neighbors, and standing firm in faith. Prophetic insights are invitations to partner with God in what He is building on earth.
        </p>
      </div>
    </div>
  );
}
