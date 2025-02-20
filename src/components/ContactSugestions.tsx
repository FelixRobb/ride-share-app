import { UserPlus, Loader } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import type { User } from "@/types"

interface SuggestedContact extends User {
  mutual_contacts: number
  contactStatus?: "pending" | "accepted" | null
}

interface ContactSuggestionsProps {
  suggestedContacts: SuggestedContact[]
  isFetchingSuggestions: boolean
  handleAddContact: (contact: SuggestedContact) => void
  currentUser: User
  isOnline: boolean
}

export function ContactSuggestions({
  suggestedContacts,
  isFetchingSuggestions,
  handleAddContact,
  isOnline,
}: ContactSuggestionsProps) {
  if (isFetchingSuggestions) {
    return (
      <div className="flex items-center justify-center p-4 w-full">
        <Loader className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (suggestedContacts.length === 0) {
    return (
      <div className="flex items-center justify-center p-4 min-w-[200px]">
        <p className="text-sm text-muted-foreground">No suggestions available</p>
      </div>
    );
  }

  return (
    <>
      {suggestedContacts.map((contact) => (
        <div
          key={contact.id}
          className="flex flex-col items-center p-4 border rounded-lg min-w-[200px] hover:bg-accent/30"
        >
          <Avatar className="h-16 w-16 mb-2">
            <AvatarFallback>{contact.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="text-center mb-2">
            <p className="font-medium">{contact.name}</p>
            <p className="text-sm text-muted-foreground">{contact.phone}</p>
          </div>
          <Button
            size="sm"
            className="w-full"
            onClick={() => handleAddContact(contact)}
            disabled={!isOnline}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        </div>
      ))}
    </>
  );
}

