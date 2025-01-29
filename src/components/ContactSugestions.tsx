import React from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { UserPlus, Check, Users, MapPin } from "lucide-react"
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
  currentUser,
  isOnline,
}: ContactSuggestionsProps) {
  if (isFetchingSuggestions) {
    return (
      <div className="w-full overflow-hidden rounded-md border">
        <ScrollArea className="w-full">
          <div className="flex space-x-4 p-4">
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <Card key={i} className="w-[200px] flex-shrink-0">
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center space-y-3">
                      <Skeleton className="h-20 w-20 rounded-full" />
                      <div className="space-y-2 w-full">
                        <Skeleton className="h-4 w-3/4 mx-auto" />
                        <Skeleton className="h-3 w-1/2 mx-auto" />
                      </div>
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-9 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    )
  }

  if (suggestedContacts.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-4">
        {isOnline ? "No suggestions at the moment." : "Suggestions unavailable while offline."}
      </p>
    )
  }

  return (
    <div className="w-full overflow-hidden rounded-md border">
      <ScrollArea className="w-full">
        <div className="flex space-x-4 p-4">
          {suggestedContacts.map((contact) => (
            <Card key={contact.id} className="w-[200px] flex-shrink-0">
              <CardContent className="p-4">
                <div className="flex flex-col items-center space-y-3">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="text-2xl">{contact.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1 text-center">
                    <h3 className="font-semibold">{contact.name}</h3>
                    <p className="text-sm text-muted-foreground">{contact.phone}</p>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{contact.mutual_contacts} mutual contacts</span>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => handleAddContact(contact)}
                    disabled={contact.contactStatus === "accepted" || !isOnline}
                  >
                    {contact.contactStatus === "accepted" ? (
                      <Check className="mr-2 h-4 w-4" />
                    ) : (
                      <UserPlus className="mr-2 h-4 w-4" />
                    )}
                    {contact.contactStatus === "accepted"
                      ? "Added"
                      : contact.contactStatus === "pending"
                        ? "Pending"
                        : "Add Contact"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}

