# Pitchtrain

Browser-based voice pitch training app. Users watch their pitch live, practice against target ranges, and review recordings — usually alongside a voice or language trainer.

## Screens

**Detail mode**:
The default practice screen: live pitch timeline, optionally with one Prompt shown at a time.
_Avoid_: Standard view, practice mode

**Reading mode**:
The screen for reading longer texts teleprompter-style while pitch is tracked.
_Avoid_: Teleprompter mode

## Practice content

**Prompt**:
A single short word, phrase or sentence shown in Detail mode to practice on. German UI: "Übungssätze" for the feature.
_Avoid_: Sentence, item, detail

**Set**:
A named collection of Prompts; built-in or user-created.
_Avoid_: List, deck

## Recordings

**Instant review**:
Playing back the take just recorded, with its pitch timeline, before it is saved or discarded.
_Avoid_: Preview, playback mode

**Take**:
A recording run that has not been saved to the Journal yet; saving it makes it a Session.
_Avoid_: Draft, unsaved session

**Journal**:
The on-device archive of saved, named sessions, with tags and ZIP backup.
_Avoid_: History, library

**Session**:
One saved, named recording run in the Journal, made of its Recording, its Pitch trace, and the voice range it was measured against.
_Avoid_: Entry, record

**Recording**:
The audio captured during a Session.
_Avoid_: Audio blob, clip

**Pitch trace**:
The time series of pitch measurements captured alongside a Recording.
_Avoid_: Samples, pitch data, curve

**Tag**:
A user-defined label attached to Sessions, identified to the user by its label text.
_Avoid_: Category, folder

**Part**:
One self-contained ZIP backup holding a date-ordered slice of the Journal's Sessions; a large Journal is exported as several Parts.
_Avoid_: Chunk, volume, split

**Offload**:
Exporting Sessions as Parts and then removing them from the Journal to free the device.
_Avoid_: Archive, prune, cleanup

## Configuration

**Feature toggle**:
A user setting that hides one optional feature (Journal, Reading mode, Prompts) without deleting its data. All are on by default.
_Avoid_: Module, flag
