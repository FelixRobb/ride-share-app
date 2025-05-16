"use client";

import { Edit, LucideUser, MessageSquare, Send, Trash } from "lucide-react";
import type React from "react";
import { useRef, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import type { Note, User, Contact, Ride } from "@/types";
import { addNote, editNote, deleteNote, markNoteAsSeen, fetchNotes } from "@/utils/api";

interface RideMessagesProps {
  ride: Ride;
  currentUser: User;
  contacts: Contact[];
  isOnline: boolean;
}

const MAX_MESSAGE_LENGTH = 1000; // Set the maximum message length

export function RideMessages({ ride, currentUser, contacts, isOnline }: RideMessagesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [isDeleteNoteDialogOpen, setIsDeleteNoteDialogOpen] = useState(false);
  const [noteToDeleteId, setNoteToDeleteId] = useState<string | null>(null);
  const [messageLength, setMessageLength] = useState(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [notesUpdated, setNotesUpdated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scrollToBottom = useCallback(() => {
    if (typeof window !== "undefined" && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        // Force the scroll to the bottom
        setTimeout(() => {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }, 100);
      }
    }
  }, []);

  // Improved scroll handling with dependencies properly tracked
  useEffect(() => {
    if (notesUpdated && !isLoading) {
      scrollToBottom();
      setNotesUpdated(false);
    }
  }, [notesUpdated, isLoading, scrollToBottom]);

  // Load notes when the component mounts
  useEffect(() => {
    let isInitialLoad = true; // Flag to track initial load
    let isMounted = true; // Flag to prevent state updates after unmount

    const loadNotes = async () => {
      if (
        ride.status === "accepted" ||
        ride.status === "cancelled" ||
        ride.status === "completed"
      ) {
        try {
          // Only set loading state on the very first load
          if (isInitialLoad && isMounted) {
            setIsLoading(true);
          }

          const fetchedNotes = await fetchNotes(ride.id);

          // Bail if unmounted
          if (!isMounted) return;

          // Check if notes have changed before updating state
          const notesChanged =
            fetchedNotes.length !== notes.length ||
            JSON.stringify(fetchedNotes) !== JSON.stringify(notes);

          if (notesChanged) {
            setNotes(fetchedNotes || []);
            setNotesUpdated(true);
          }

          // Automatically mark new notes as seen
          const unseenNotes = fetchedNotes.filter(
            (note: Note) =>
              note.user_id !== currentUser.id &&
              (!note.seen_by || !note.seen_by.includes(currentUser.id))
          );

          if (unseenNotes.length > 0) {
            await Promise.all(unseenNotes.map((note) => markNoteAsSeen(note.id)));
          }
        } catch {
          if (isMounted) {
            toast.error("Failed to load messages");
          }
        } finally {
          if (isInitialLoad && isMounted) {
            setIsLoading(false);
            isInitialLoad = false; // Mark initial load as complete
          }
        }
      }
    };

    loadNotes();

    // Set up periodic refresh for notes
    const intervalId = setInterval(() => {
      loadNotes();
    }, 10000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [ride.id, ride.status, currentUser.id, notes]);

  // Additional effect to scroll on first load when loading completes
  useEffect(() => {
    if (!isLoading && notes.length > 0) {
      scrollToBottom();
    }
  }, [isLoading, notes.length, scrollToBottom]);

  const getUserName = (userId: string) => {
    if (userId === currentUser.id) {
      return currentUser.name;
    }
    const contact = contacts.find((c) => c.user_id === userId || c.contact_id === userId);
    return contact
      ? contact.user_id === userId
        ? contact.user.name
        : contact.contact.name
      : "Unknown User";
  };

  const handleEditNote = async (noteId: string) => {
    const noteToEdit = notes.find((note) => note.id === noteId);
    if (noteToEdit) {
      // Prevent editing deleted messages
      if (noteToEdit.is_deleted) {
        toast.error("Cannot edit a deleted message.");
        return;
      }

      const noteDate = new Date(noteToEdit.created_at);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000); // Current time minus one hour

      // Check if the note was created less than an hour ago
      if (noteDate < oneHourAgo) {
        toast.error("You can only edit messages sent within the last hour.");
        return; // Prevent editing if the note is older than one hour
      }

      setEditingNoteId(noteId);
      setNewNote(noteToEdit.note);
      setMessageLength(noteToEdit.note.length);
      setIsEditing(true);

      // Focus the textarea
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();

          // Adjust textarea height based on content
          textareaRef.current.style.height = "40px";
          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
        }
      }, 0);
    }
  };

  const cancelEdit = () => {
    setEditingNoteId(null);
    setNewNote("");
    setMessageLength(0);
    setIsEditing(false);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px";
    }
  };

  const confirmDeleteNote = async () => {
    if (noteToDeleteId) {
      try {
        await deleteNote(noteToDeleteId);
        setNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteToDeleteId));
        toast.success("Message deleted successfully.");
      } catch {
        toast.error("Failed to delete message. Please try again.");
      } finally {
        setIsDeleteNoteDialogOpen(false);
        setNoteToDeleteId(null);
      }
    }
  };

  const handleDeleteNote = (noteId: string) => {
    const noteToDelete = notes.find((note) => note.id === noteId);
    if (noteToDelete && noteToDelete.is_deleted) {
      toast.error("This message has already been deleted.");
      return;
    }

    setNoteToDeleteId(noteId);
    setIsDeleteNoteDialogOpen(true);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newNote.trim() && currentUser && ride && !isSubmitting) {
      try {
        setIsSubmitting(true); // Prevent multiple submissions

        if (isEditing && editingNoteId) {
          // Handle edit case
          const updatedNote = await editNote(editingNoteId, newNote);
          setNotes((prevNotes) =>
            prevNotes.map((note) => (note.id === editingNoteId ? updatedNote : note))
          );
          toast.success("Message edited successfully.");

          // Reset editing state
          setEditingNoteId(null);
          setIsEditing(false);
        } else {
          // Handle new message case
          const addedNote = await addNote(ride.id, newNote);
          if (addedNote) {
            setNotes((prevNotes) => [...prevNotes, addedNote]);
            setNotesUpdated(true); // Flag that notes were updated
            toast.success("Message sent successfully.");
          }
        }

        // Reset form
        setNewNote("");
        setMessageLength(0);

        // Reset textarea height
        if (textareaRef.current) {
          textareaRef.current.style.height = "40px";
        }
      } catch {
        toast.error(
          isEditing
            ? "Failed to edit message. Please try again."
            : "Failed to send message. Please try again."
        );
      } finally {
        setIsSubmitting(false); // Re-enable submission
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <span className="font-semibold">Messages</span>
        </div>
        {notes.length > 0 && (
          <Badge variant="outline" className="text-xs">
            {notes.length} {notes.length === 1 ? "message" : "messages"}
          </Badge>
        )}
      </div>

      <div className="rounded-lg border bg-card">
        <ScrollArea className="h-[400px] px-4 pt-4" ref={scrollAreaRef}>
          {isLoading && notes.length === 0 ? (
            <div className="flex flex-col space-y-4 p-4">
              <div className="flex items-start space-x-2">
                <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-16 w-full max-w-[70%] bg-muted animate-pulse rounded" />
                </div>
              </div>
              <div className="flex items-end justify-end space-x-2">
                <div className="flex-1 flex justify-end space-y-2">
                  <div className="h-12 w-full max-w-[70%] bg-primary/30 animate-pulse rounded" />
                </div>
                <div className="w-8 h-8 rounded-full bg-primary/30 animate-pulse" />
              </div>
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[350px] space-y-3">
              <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-center">No messages yet</p>
              <p className="text-xs text-muted-foreground text-center">
                Messages between you and other participants will appear here
              </p>
            </div>
          ) : (
            <div className="pb-4">
              {notes.reduce((acc: React.ReactNode[], note, index) => {
                const currentDate = new Date(note.created_at).toLocaleDateString();
                const previousDate =
                  index > 0 ? new Date(notes[index - 1].created_at).toLocaleDateString() : null;
                const nextNote = index < notes.length - 1 ? notes[index + 1] : null;

                // Add date separator
                if (currentDate !== previousDate) {
                  acc.push(
                    <div
                      key={`date-separator-${currentDate}-${index}`}
                      className="relative flex py-3 my-2"
                    >
                      <div className="flex-grow border-t border-muted" />
                      <span className="flex-shrink mx-4 text-xs font-medium text-muted-foreground">
                        {currentDate === new Date().toLocaleDateString() ? "Today" : currentDate}
                      </span>
                      <div className="flex-grow border-t border-muted" />
                    </div>
                  );
                }

                const isCurrentUser = note.user_id === currentUser?.id;
                const noteDate = new Date(note.created_at);
                const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000); // Current time minus one hour
                const isEditable = noteDate >= oneHourAgo; // Check if the note is editable

                // Check if this message is at the end of a consecutive group from the same user
                const isLastInGroup =
                  !nextNote ||
                  nextNote.user_id !== note.user_id ||
                  new Date(nextNote.created_at).toLocaleDateString() !== currentDate;

                // Check if this is part of a message group
                const isFirstInGroup =
                  index === 0 ||
                  notes[index - 1].user_id !== note.user_id ||
                  currentDate !== previousDate;

                acc.push(
                  <div
                    key={`message-${note.id}-${index}`}
                    className={`group relative flex flex-col ${isCurrentUser ? "items-end" : "items-start"} 
                    ${isFirstInGroup ? "mt-4" : "mt-3"} 
                    ${!isLastInGroup ? "mb-3" : "mb-4"}`}
                  >
                    {/* Show name only for first message in a group when it's not current user */}
                    {isFirstInGroup && !isCurrentUser && (
                      <span className="text-xs font-medium text-muted-foreground ml-10 mb-1">
                        {getUserName(note.user_id)}
                      </span>
                    )}

                    <div className="flex items-end gap-2 max-w-[70%]">
                      {/* Show user icon only at the bottom of a group for non-current users */}
                      {!isCurrentUser && isLastInGroup && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <LucideUser className="w-4 h-4 text-primary" />
                        </div>
                      )}

                      {/* Fixed spacer width for consistent alignment */}
                      {!isCurrentUser && !isLastInGroup && (
                        <div className="w-8 flex-shrink-0 invisible">
                          <span className="sr-only">Other User</span>
                        </div>
                      )}

                      {/* Message content with hover-activated action buttons for current user */}
                      <div className="relative max-w-full message-container">
                        <div
                          className={`px-4 py-2 shadow-sm overflow-hidden ${
                            isCurrentUser
                              ? note.is_deleted
                                ? "bg-muted text-muted-foreground rounded-lg rounded-br-none"
                                : "bg-primary text-primary-foreground rounded-lg rounded-br-none"
                              : note.is_deleted
                                ? "bg-muted text-muted-foreground rounded-lg rounded-bl-none"
                                : "bg-secondary text-secondary-foreground rounded-lg rounded-bl-none"
                          }`}
                        >
                          <div className="overflow-hidden whitespace-wrap">
                            <p className={`text-sm break-words ${note.is_deleted ? "italic" : ""}`}>
                              {note.note}
                            </p>
                            <div
                              className={`flex items-center text-xs opacity-70 mt-1 ${isCurrentUser ? "justify-end" : "justify-start"}`}
                            >
                              <span>
                                {new Date(note.created_at).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                                {note.is_edited && !note.is_deleted && " • edited"}
                                {note.is_deleted && " • deleted"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons overlay for current user messages that aren't deleted */}
                        {isCurrentUser && !editingNoteId && !note.is_deleted && (
                          <div className="absolute -top-3 -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out z-20">
                            <div className="bg-background/90 backdrop-blur-sm rounded-full shadow-md border border-border flex overflow-hidden p-0.5">
                              {isEditable && (
                                <Button
                                  onClick={() => handleEditNote(note.id)}
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 rounded-full hover:bg-primary/10 hover:text-primary"
                                  disabled={!isOnline}
                                >
                                  <Edit className="h-3 w-3" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                              )}
                              <Button
                                onClick={() => handleDeleteNote(note.id)}
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive"
                                disabled={!isOnline}
                              >
                                <Trash className="h-3 w-3" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Current user icon at the bottom of their message group */}
                      {isCurrentUser && isLastInGroup && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                          <LucideUser className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}

                      {/* Fixed spacer width for consistent alignment */}
                      {isCurrentUser && !isLastInGroup && (
                        <div className="w-8 flex-shrink-0 invisible">
                          <span className="sr-only">Me</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
                return acc;
              }, [])}
            </div>
          )}
        </ScrollArea>

        {/* Message input area with improved styling */}
        {ride && (ride.status === "accepted" || ride.status === "completed") && (
          <div className="border-t p-3">
            <div className="flex flex-col">
              {/* Edit mode indicator and cancel button */}
              {isEditing && (
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center gap-2 text-primary">
                    <Edit className="h-4 w-4" />
                    <span className="text-sm font-medium">Editing message</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={cancelEdit}
                    className="h-7 text-xs hover:text-destructive"
                  >
                    Cancel
                  </Button>
                </div>
              )}
              {/* Character count display */}
              <div className="text-sm text-muted-foreground mb-1">
                {MAX_MESSAGE_LENGTH - messageLength} characters remaining
              </div>

              <form className="flex items-center gap-2" onSubmit={handleSendMessage}>
                <Textarea
                  ref={textareaRef}
                  value={newNote}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= MAX_MESSAGE_LENGTH) {
                      setNewNote(value);
                      setMessageLength(value.length);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape" && isEditing) {
                      e.preventDefault();
                      cancelEdit();
                    } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder={isEditing ? "Edit your message..." : "Type your message..."}
                  className={`flex-grow border-muted resize-none overflow-y-auto max-w-full min-h-[40px] max-h-[150px] ${
                    isEditing ? "bg-secondary/30 focus:bg-background" : "bg-background"
                  }`}
                  rows={1}
                  onInput={() => {
                    // Reset to minimum height before calculating new height
                    if (textareaRef.current) {
                      textareaRef.current.style.height = "40px";
                      // Set new height based on content
                      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
                    }
                  }}
                  disabled={!isOnline}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!isOnline || !newNote.trim() || isSubmitting}
                  className={`h-10 w-10 shrink-0 rounded-full ${isEditing ? "bg-amber-500 hover:bg-amber-600" : ""}`}
                  title={isEditing ? "Save edit (Ctrl+Enter)" : "Send message (Ctrl+Enter)"}
                >
                  {isSubmitting ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : isEditing ? (
                    <Edit className="h-4 w-4" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {isSubmitting ? "Sending..." : isEditing ? "Save edit" : "Send message"}
                  </span>
                </Button>
              </form>

              {!isOnline && (
                <p className="mt-2 text-xs text-destructive">
                  You&apos;re offline. Messages will be sent when you reconnect.
                </p>
              )}

              {isEditing && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Press Esc to cancel, Ctrl+Enter to save changes
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <Dialog open={isDeleteNoteDialogOpen} onOpenChange={setIsDeleteNoteDialogOpen}>
        <DialogContent className="rounded-lg w-11/12">
          <DialogHeader>
            <DialogTitle>Confirm Delete Message</DialogTitle>
            <DialogDescription>Are you sure you want to delete this message?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              className="mb-2"
              variant="outline"
              onClick={() => setIsDeleteNoteDialogOpen(false)}
            >
              No, Keep Message
            </Button>
            <Button className="mb-2" variant="destructive" onClick={confirmDeleteNote}>
              Yes, Delete Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
