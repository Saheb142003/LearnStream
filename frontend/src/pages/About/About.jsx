import React from "react";
import { Sparkles, BookOpen, Zap, Users, Brain, Target } from "lucide-react";
import { Link } from "react-router-dom";

const About = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-white text-gray-900 py-20 px-6 border-b border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 px-4 py-1.5 rounded-full text-indigo-700 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Revolutionizing Online Learning</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight leading-tight text-gray-900">
            We're Building the Future of <br />
            <span className="text-indigo-600">Intelligent Education</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            LearnStream is your AI-powered companion that turns passive watching
            into active, measurable mastery.
          </p>
        </div>
      </div>

      {/* Mission Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Our Mission
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-6">
              In an era of information overload, finding content is easy, but
              truly learning from it is hard. We believe that education should
              be personalized, interactive, and efficient.
            </p>
            <p className="text-gray-600 text-lg leading-relaxed">
              Our mission is to empower learners by leveraging Artificial
              Intelligence to distill complex video content into digestible
              insights, actionable summaries, and interactive assessments. We
              help you learn faster and retain more.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
              <Brain className="w-8 h-8 text-indigo-600 mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">AI Powered</h3>
              <p className="text-sm text-gray-600">
                Advanced algorithms to summarize and explain content.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 mt-0 sm:mt-8">
              <Target className="w-8 h-8 text-indigo-600 mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Goal Oriented</h3>
              <p className="text-sm text-gray-600">
                Track your progress and achieve your learning milestones.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
              <Zap className="w-8 h-8 text-indigo-600 mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Efficient</h3>
              <p className="text-sm text-gray-600">
                Save hours by getting straight to the key concepts.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 mt-0 sm:mt-8">
              <Users className="w-8 h-8 text-indigo-600 mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Community</h3>
              <p className="text-sm text-gray-600">
                Join a global community of lifelong learners.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Story/Values Section */}
      <div className="bg-gray-50 py-20 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why LearnStream?
            </h2>
            <p className="text-gray-600">
              We are solving the biggest problem in online education:{" "}
              <span className="font-semibold text-indigo-600">Engagement</span>.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <BookOpen className="w-6 h-6 text-indigo-600" />,
                title: "Curated Content",
                desc: "We don't just aggregate videos; we curate learning paths that guide you from beginner to expert.",
              },
              {
                icon: <Brain className="w-6 h-6 text-indigo-600" />,
                title: "Cognitive Enhancement",
                desc: "Our tools are designed to work with your brain, using spaced repetition and active recall techniques.",
              },
              {
                icon: <Sparkles className="w-6 h-6 text-indigo-600" />,
                title: "Seamless Experience",
                desc: "A clean, distraction-free interface that puts your learning experience first.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="group p-8 rounded-xl bg-white border border-gray-100 hover:border-indigo-100 hover:shadow-md transition-all duration-300"
              >
                <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center mb-6">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of students who are already learning smarter, not
            harder. Start your journey with LearnStream today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/feed"
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Start Learning Now
            </Link>
            <Link
              to="/contact"
              className="px-8 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
