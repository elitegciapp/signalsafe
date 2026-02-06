"use client";

import { useEffect, useState } from "react";
import { getContacts, saveContact, deleteContact } from "@/lib/contacts";

export default function Contacts() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => setContacts(getContacts()), []);

  function add() {
    if (!name || !phone) return;

    saveContact({
      id: crypto.randomUUID(),
      name,
      phone,
      email,
      notes
    });
    setContacts(getContacts());
    setName("");
    setPhone("");
    setEmail("");
    setNotes("");
  }

  function remove(id: string) {
    deleteContact(id);
    setContacts(getContacts());
  }

  return (
    <main className="p-6 max-w-xl mx-auto space-y-4">
      <h1 className="text-xl font-semibold">Trusted Contacts</h1>

      <div className="flex gap-2">
        <input className="border p-2" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
        <input className="border p-2" placeholder="Phone" value={phone} onChange={e=>setPhone(e.target.value)} />
        <input
          className="border p-2"
          placeholder="Email (optional)"
          value={email}
          onChange={e=>setEmail(e.target.value)}
        />

        <input
          className="border p-2"
          placeholder="Notes (Bank fraud dept, Realtor, etc)"
          value={notes}
          onChange={e=>setNotes(e.target.value)}
        />
        <button className="border px-3" onClick={add}>Add</button>
      </div>

      <div className="space-y-2">
        {contacts.map(c => (
          <div key={c.id} className="border p-2 flex justify-between">
            <div>
              <div>{c.name}</div>
              {c.phone && <div>📞 {c.phone}</div>}
              {c.email && <div>✉️ {c.email}</div>}
              {c.notes && <div className="text-xs opacity-60">{c.notes}</div>}
            </div>
            <button onClick={()=>remove(c.id)}>Delete</button>
          </div>
        ))}
      </div>
    </main>
  );
}
