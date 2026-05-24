import re

with open("src/app/dashboard/page.tsx", "r") as f:
    content = f.read()

target = """                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}"""

ui = """                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* MESSAGES TAB */}
          {activeTab === "messages" && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden h-[75vh] flex">
              {/* Left Sidebar */}
              <div className="w-1/3 border-r border-gray-100 dark:border-gray-800 flex flex-col">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-indigo-500" /> Messages
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {chatConversations.length === 0 && (
                    <div className="p-6 text-center text-gray-400 text-xs font-medium">
                      No messages yet.
                    </div>
                  )}
                  {chatConversations.map((chat) => (
                    <div 
                      key={chat.id} 
                      onClick={() => setSelectedEmployerId(chat.id)}
                      className={`p-4 border-b border-gray-50 dark:border-gray-800/50 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 flex gap-3 ${
                        selectedEmployerId === chat.id ? "bg-indigo-50/50 dark:bg-indigo-900/10 border-l-4 border-l-indigo-500" : "border-l-4 border-l-transparent"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm shrink-0 relative">
                        {chat.company.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <h4 className="text-sm font-extrabold text-gray-900 dark:text-white truncate">{chat.name}</h4>
                          <span className="text-[10px] font-bold text-gray-400 shrink-0">{chat.time}</span>
                        </div>
                        <p className="text-[10px] text-indigo-500 font-bold mb-1">{chat.company}</p>
                        <p className="text-xs truncate text-gray-500 font-medium">
                          {chat.lastMsg}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Window */}
              {selectedEmployerId ? (
                <div className="flex-1 flex flex-col bg-gray-50/30 dark:bg-gray-950/50">
                  {/* Chat Header */}
                  <div className="h-16 px-6 border-b border-gray-100 dark:border-gray-800 flex items-center bg-white dark:bg-gray-900 shrink-0">
                    <div>
                      <h3 className="font-extrabold text-gray-900 dark:text-white text-sm">
                        {chatConversations.find(c => c.id === selectedEmployerId)?.name}
                      </h3>
                      <p className="text-[10px] font-bold text-gray-500">
                        {chatConversations.find(c => c.id === selectedEmployerId)?.company}
                      </p>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
                    {chatMessages.filter(m => (m.sender_type === "employer" && m.sender_id === selectedEmployerId) || (m.sender_type === "candidate" && m.receiver_id === selectedEmployerId)).map((m: any) => {
                      const isCandidate = m.sender_type === "candidate";
                      return (
                        <div key={m.id} className={`flex items-start gap-3 ${isCandidate ? "justify-end" : ""}`}>
                          {!isCandidate && (
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xs shrink-0 mt-1">
                              {m.sender_name?.slice(0, 2).toUpperCase() || "HR"}
                            </div>
                          )}
                          <div className={`${isCandidate ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-tl-sm"} p-3 rounded-2xl max-w-[75%] shadow-sm`}>
                            <p className="text-xs font-medium leading-relaxed">{m.message}</p>
                            <span className={`text-[9px] font-bold block mt-1 ${isCandidate ? "opacity-70 text-right" : "text-gray-400"}`}>
                              {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Chat Input */}
                  <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shrink-0">
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-850 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                      <button type="button" className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-colors">
                        <Paperclip className="w-4 h-4" />
                      </button>
                      <input 
                        type="text" 
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        placeholder="Type your message..." 
                        className="flex-1 bg-transparent px-2 text-xs outline-none text-gray-900 dark:text-white"
                      />
                      <button type="submit" className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm">
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/30 dark:bg-gray-950/50">
                  <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-700 mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Your Inbox</h3>
                  <p className="text-sm text-gray-500">Select a conversation from the left to start chatting</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}"""

if "{/* MESSAGES TAB */}" not in content:
    content = content.replace(target, ui)

with open("src/app/dashboard/page.tsx", "w") as f:
    f.write(content)

