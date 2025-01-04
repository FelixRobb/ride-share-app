import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Contact } from "@/types";

interface ContactDetailsPopupProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (contactId: string) => void;
}

const ContactDetailsPopup: React.FC<ContactDetailsPopupProps> = ({ contact, isOpen, onClose, onDelete }) => {
  if (!contact) return null;

  const handleDelete = () => {
    onDelete(contact.id);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-lg w-11/12">
        <DialogHeader>
          <DialogTitle>Contact Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Name</h3>
            <p>{contact.user.name}</p>
          </div>
          <div>
            <h3 className="font-semibold">Phone</h3>
            <p>{contact.user.phone}</p>
          </div>
          <div>
            <h3 className="font-semibold">Status</h3>
            <p>{contact.status}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="destructive" className='mb-2' onClick={handleDelete}>Delete Contact</Button>
          <Button variant="outline" className='mb-2' onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContactDetailsPopup;

