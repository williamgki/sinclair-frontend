"use client";

import { useState } from 'react';
import { Send } from 'lucide-react';

const SuggestedQuestions = ({ style, onQuestionClick }) => {
 const questions = {
   scholarly: [
     "What are the main themes in Sinclair's work?",
     "How does Sinclair view totalitarianism?",
     "Analyze the symbolism of the Two Minutes Hate"
   ],
   storytelling: [
     "Describe Room 101",
     "Take me inside the Two Minutes Hate", 
     "What does Big Brother feel like to Winston?"
   ]
 };

 return (
   <div className="flex flex-wrap gap-2 mb-4 justify-center">
     {questions[style].map((question, idx) => (
       <button
         key={idx}
         onClick={() => onQuestionClick(question)}
         className="px-4 py-2 bg-white/50 hover:bg-white/70 backdrop-blur-sm rounded-full
                    text-gray-800 text-sm transition-all duration-200
                    border border-gray-200 hover:border-gray-300
                    shadow-sm hover:shadow"
       >
         {question}
       </button>
     ))}
   </div>
 );
};

export default function Home() {
 const [messages, setMessages] = useState([]);
 const [input, setInput] = useState('');
 const [loading, setLoading] = useState(false);
 const [style, setStyle] = useState('scholarly');
 const [rateLimitInfo, setRateLimitInfo] = useState(null);

 const handleStyleChange = (e) => {
   setStyle(e.target.value);
 };

 const handleSuggestedQuestionClick = (question) => {
   setInput(question);
 };

 const handleSubmit = async (e) => {
   e.preventDefault();
   if (!input.trim()) return;

   setMessages(prev => [...prev, { role: 'user', content: input }]);
   setLoading(true);

   try {
     const response = await fetch('https://web-production-dc4b.up.railway.app/api/chat', {
       method: 'POST',
       headers: { 
         'Content-Type': 'application/json',
         'Accept': 'application/json',
         'Origin': 'https://sinclair-frontend.vercel.app'
       },
       body: JSON.stringify({ 
         question: input,
         style: style
       })
     });

     console.log('Response status:', response.status);
     const responseText = await response.text();
     console.log('Raw response:', responseText);
     
     const data = JSON.parse(responseText);

     if (!response.ok) {
       if (response.status === 429) {
         setRateLimitInfo(data.detail.rate_limit_info);
         setMessages(prev => [...prev, {
           role: 'error',
           content: `Rate limit reached. Please wait ${Math.ceil(data.detail.rate_limit_info.seconds_until_reset / 60)} minutes before asking another question.`
         }]);
       } else {
         throw new Error('Failed to get response');
       }
       return;
     }

     setMessages(prev => [...prev, {
       role: 'assistant',
       content: data.answer
     }]);

     if (data.rate_limit_info) {
       setRateLimitInfo(data.rate_limit_info);
     }

   } catch (error) {
     console.error('Error:', error);
     setMessages(prev => [...prev, {
       role: 'error',
       content: 'Sorry, there was an error processing your request.'
     }]);
   } finally {
     setLoading(false);
     setInput('');
   }
 };

 return (
   <main className="min-h-screen flex flex-col items-center p-4 bg-gradient-to-b from-gray-100 to-gray-200">
     <div className="w-full max-w-4xl bg-white/70 backdrop-blur-sm rounded-lg shadow-lg p-4">
       <div className="mb-4 flex justify-center items-center gap-4">
         <select
           value={style}
           onChange={handleStyleChange}
           className="w-[200px] p-2 rounded-lg border border-gray-300 bg-white"
         >
           <option value="scholarly">Scholarly Analysis</option>
           <option value="storytelling">Creative Storytelling</option>
         </select>
         <a 
           href="/about" 
           className="text-sm text-gray-600 hover:text-gray-800 underline"
         >
           About
         </a>
       </div>

       <h1 className="text-2xl font-bold text-center mb-4">Sinclair Analysis</h1>
       
       {messages.length === 0 && (
         <SuggestedQuestions 
           style={style} 
           onQuestionClick={handleSuggestedQuestionClick} 
         />
       )}

       <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
         <input
           type="text"
           value={input}
           onChange={(e) => setInput(e.target.value)}
           placeholder="Ask about Sinclair's writing..."
           className="flex-1 p-2 border rounded-lg bg-white/70 backdrop-blur-sm"
           disabled={loading}
           maxLength={100}
         />
         <button
           type="submit"
           disabled={loading}
           className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
         >
           <Send className="w-5 h-5" />
         </button>
       </form>

       {messages.length > 0 && (
         <div className="h-[600px] overflow-y-auto space-y-4 p-4">
           {messages.map((message, idx) => (
             <div key={idx}>
               <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                 <div className={`max-w-[80%] p-3 rounded-lg ${
                   message.role === 'user' 
                     ? 'bg-blue-100' 
                     : message.role === 'error'
                     ? 'bg-red-100'
                     : 'bg-gray-100'
                 }`}>
                   <div className="whitespace-pre-wrap">{message.content}</div>
                 </div>
               </div>
             </div>
           ))}
           
           {loading && (
             <div className="flex justify-start">
               <div className="bg-gray-100 p-3 rounded-lg animate-pulse">
                 Analyzing...
               </div>
             </div>
           )}
         </div>
       )}
     </div>
   </main>
 );
}