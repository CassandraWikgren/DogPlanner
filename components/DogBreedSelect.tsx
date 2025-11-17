"use client";

import React, { useState, useRef, useEffect } from "react";
import { DOG_BREEDS } from "@/lib/dogBreeds";
import { ChevronDown, Search } from "lucide-react";

interface DogBreedSelectProps {
  value: string;
  onChange: (breed: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  id?: string;
}

export function DogBreedSelect({
  value,
  onChange,
  placeholder = "Välj hundras...",
  required = false,
  className = "",
  id,
}: DogBreedSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filtrera hundraser baserat på sökning
  const filteredBreeds = search
    ? DOG_BREEDS.filter((breed) =>
        breed.toLowerCase().includes(search.toLowerCase())
      )
    : DOG_BREEDS;

  // Stäng dropdown när man klickar utanför
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Fokusera sökinputen när dropdown öppnas
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      // Alfabetisk snabbnavigering - hoppa till första rasen som börjar med bokstaven
      if (e.key.length === 1 && /[a-zåäöA-ZÅÄÖ]/.test(e.key)) {
        const char = e.key.toLowerCase();
        const index = filteredBreeds.findIndex((breed) =>
          breed.toLowerCase().startsWith(char)
        );
        if (index !== -1) {
          setHighlightedIndex(index);
          // Scrolla till elementet
          const item = listRef.current?.children[index] as HTMLElement;
          if (item) {
            item.scrollIntoView({ block: "nearest", behavior: "smooth" });
          }
        }
        return;
      }

      // Piltangenter
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredBreeds.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === "Enter" && highlightedIndex >= 0) {
        e.preventDefault();
        onChange(filteredBreeds[highlightedIndex]);
        setIsOpen(false);
        setSearch("");
      } else if (e.key === "Escape") {
        setIsOpen(false);
        setSearch("");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredBreeds, highlightedIndex, onChange]);

  // Scrolla till highlightad item
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      if (item) {
        item.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [highlightedIndex]);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        type="button"
        id={id}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 text-left bg-white border rounded-lg flex items-center justify-between transition-colors ${
          isOpen
            ? "border-[#2c7a4c] ring-2 ring-[#2c7a4c]/20"
            : "border-gray-300 hover:border-gray-400"
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={value ? "text-gray-900" : "text-gray-500"}>
          {value || placeholder}
        </span>
        <ChevronDown
          className={`h-5 w-5 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl">
          {/* Sökfält */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setHighlightedIndex(0);
                }}
                placeholder="Sök hundras..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]/20 focus:border-[#2c7a4c]"
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Tryck på första bokstaven för att hoppa till rasen
            </p>
          </div>

          {/* Lista */}
          <div
            ref={listRef}
            className="max-h-60 overflow-y-auto"
            role="listbox"
          >
            {filteredBreeds.length > 0 ? (
              filteredBreeds.map((breed, index) => (
                <button
                  key={breed}
                  type="button"
                  onClick={() => {
                    onChange(breed);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors border-l-2 ${
                    breed === value
                      ? "bg-gray-50 border-l-[#2c7a4c] font-medium text-gray-900"
                      : "border-l-transparent hover:bg-gray-50 text-gray-700 bg-white"
                  } ${index === highlightedIndex ? "bg-gray-100" : ""}`}
                  role="option"
                  aria-selected={breed === value}
                >
                  {breed}
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                Ingen hundras hittades
              </div>
            )}
          </div>

          {/* Footer med antal resultat */}
          {filteredBreeds.length > 0 && (
            <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-200 bg-gray-50">
              {filteredBreeds.length} av {DOG_BREEDS.length} raser
            </div>
          )}
        </div>
      )}

      {required && !value && (
        <input
          type="text"
          value=""
          onChange={() => {}}
          required
          className="absolute inset-0 opacity-0 pointer-events-none"
          tabIndex={-1}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
