# ClassToCode 🚀

### Interactive UML Class Diagram Designer & Multi-Language Code Generator

**ClassToCode** is a web-based UML Class Diagram tool that allows users to visually design object-oriented class structures and automatically generate source code from those designs.

The platform bridges the gap between **UML modeling and implementation** by allowing developers and students to create classes, define attributes and methods, establish relationships, and generate code in multiple programming languages.

---

## ✨ Features

### 📐 UML Class Diagram Modeling

Create and design UML class structures with support for:

* Regular Classes
* Abstract Classes
* Interfaces
* Attributes / Fields
* Methods
* Method parameters
* Return types
* Visibility modifiers

Supported visibility modifiers include:

| Symbol | Visibility |
| ------ | ---------- |
| `+`    | Public     |
| `-`    | Private    |
| `#`    | Protected  |
| `~`    | Package    |

---

### 🔗 UML Relationships

ClassToCode supports several important UML relationship types:

| Relationship       | Meaning                                                   |
| ------------------ | --------------------------------------------------------- |
| **Inheritance**    | `is-a / extends`                                          |
| **Implementation** | `implements`                                              |
| **Composition**    | Strong ownership relationship                             |
| **Aggregation**    | Has-a relationship where the part can exist independently |
| **Association**    | Uses / refers to                                          |
| **Dependency**     | Depends on                                                |

These relationships are represented visually using different line styles, arrows, and UML symbols.

---

## 💻 Multi-Language Code Generation

One of the key features of ClassToCode is the ability to generate source code for multiple programming languages.

Currently supported:

* ☕ Java
* 🟨 JavaScript
* 🔷 TypeScript
* 🐍 Python
* 🟦 C#

The application maps UML data types to language-specific types where appropriate.

### Example

A UML class such as:

```text
┌─────────────────────────┐
│          Car            │
├─────────────────────────┤
│ - brand : String        │
│ - speed : int           │
├─────────────────────────┤
│ + accelerate() : void   │
│ + brake() : void        │
└─────────────────────────┘
```

can be transformed into source code for the selected programming language.

---

## 🏗️ Supported Class Types

ClassToCode supports three UML entity types:

```text
Class
Abstract Class
Interface
```

For example:

```text
        Vehicle
      <<abstract>>
           ▲
           │ inheritance
           │
          Car
           │
           │ implements
           ▼
       Drivable
```

The generated code reflects inheritance and interface implementation relationships.

---

## ⚙️ Intelligent Relationship-Based Code Generation

ClassToCode doesn't simply convert individual UML boxes into code.

Relationships can influence the generated class structure.

For example:

### Composition

A composition relationship can generate a member object and initialize it:

```java
private Engine engine = new Engine();
```

### Aggregation

An aggregation relationship can generate a collection:

```java
private List<Engine> engineList = new ArrayList<>();
```

### Association

An association can generate a reference to another class:

```java
private Engine engine;
```

These relationship-specific fields are generated automatically from the UML model.

---

## ☕ Java Code Generation

For Java, ClassToCode can generate:

* Classes
* Abstract classes
* Interfaces
* Fields
* Visibility modifiers
* Constructors
* Getters
* Setters
* Methods
* Method parameters
* Inheritance
* Interface implementation
* Relationship-based fields
* Required imports

For example, a non-void method can automatically receive an appropriate default return value when generating the method body.

---

## 🐍 Python Code Generation

Python classes can be generated from the UML model with:

* Class inheritance
* Constructor generation
* Instance attributes
* Methods
* Method parameters

Example:

```python
class Student:

    def __init__(self):
        self.name = None

    def display(self):
        pass
```

---

## 🔷 TypeScript Code Generation

TypeScript generation supports:

* Classes
* Inheritance
* Typed fields
* Constructors
* Typed method parameters
* Return types

The generator also performs basic type conversion, such as:

```text
UML int     → number
UML String  → string
UML boolean → boolean
UML void    → void
```

---

## 🟨 JavaScript Code Generation

JavaScript classes can also be generated from the same UML model.

The generator adapts the UML structure to JavaScript's type system, where explicit field types are not required.

---

## 🟦 C# Code Generation

C# generation supports:

* Classes
* Inheritance
* Private fields
* Constructors
* Methods
* Method parameters
* Language-specific type conversion

For example:

```csharp
public class Student
{
    private string name;

    public Student()
    {
    }

    public void display()
    {
        // TODO: implement
    }
}
```

---

## 🔄 UML → Code Workflow

The overall workflow of ClassToCode can be represented as:

```text
                    ┌──────────────────────┐
                    │      ClassToCode      │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Create UML Classes   │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Add Attributes       │
                    │ & Methods            │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Define Relationships │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Select Programming   │
                    │ Language             │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
           JavaScript       TypeScript        Java
              │                │                │
              ├───────────────┼────────────────┤
              │                │                │
              ▼                ▼                ▼
           Python             C#          Generated Code
```

---

## 🧠 Smart Code Generation

The generator processes the UML model before producing source code.

For example:

```text
UML Class
   │
   ├── Class Type
   ├── Attributes
   ├── Methods
   ├── Visibility
   ├── Parameters
   └── Relationships
            │
            ▼
      Code Generator
            │
            ▼
     Language Mapping
            │
            ▼
     Generated Source Code
```

The same UML architecture can therefore be used as the basis for different programming languages.

---

## 🛠️ Technology Stack

| Technology                | Purpose                 |
| ------------------------- | ----------------------- |
| React                     | Frontend application    |
| TypeScript                | Application development |
| JavaScript                | Code generation logic   |
| HTML/CSS                  | User interface          |
| UML                       | Software modeling       |
| Multi-language generators | Source code generation  |

---

## 📂 Project Structure

```text
ClassToCode/
│
├── public/
│
├── src/
│   ├── components/
│   ├── ...
│
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have:

* Node.js
* npm
* Git

### Clone the repository

```bash
git clone https://github.com/vrd2003/ClassToCode.git
```

### Navigate to the project

```bash
cd ClassToCode
```

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm start
```

The application should then be available through the local development URL provided by the React development server.

---

## 🎯 Use Cases

### 👨‍🎓 Students

Learn UML, Object-Oriented Programming, and the relationship between software architecture and implementation.

### 👨‍💻 Developers

Quickly convert UML designs into programming-language-specific class structures.

### 👩‍🏫 Educators

Demonstrate:

* UML concepts
* Class relationships
* Inheritance
* Composition
* Aggregation
* Interfaces
* Object-oriented design

### 🏗️ Software Architects

Create an initial object-oriented design and use it as a starting point for implementation.

---

## 🌟 What Makes ClassToCode Different?

Traditional UML tools primarily focus on **diagram creation**.

ClassToCode combines:

```text
┌─────────────────────────────┐
│       UML DESIGN            │
├─────────────────────────────┤
│ Classes                     │
│ Abstract Classes            │
│ Interfaces                  │
│ Attributes                  │
│ Methods                     │
│ Relationships               │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│    CODE GENERATION          │
├─────────────────────────────┤
│ Java                        │
│ JavaScript                  │
│ TypeScript                  │
│ Python                      │
│ C#                          │
└─────────────────────────────┘
```

This makes the tool useful not only for **visual modeling**, but also for moving from architecture toward implementation.

---

## 🔮 Future Enhancements

Potential improvements include:

* [ ] Drag-and-drop class positioning
* [ ] More advanced UML elements
* [ ] Sequence diagram support
* [ ] Use-case diagram support
* [ ] Activity diagram support
* [ ] Export diagrams as PNG/SVG
* [ ] Export generated code as files
* [ ] Project save/load functionality
* [ ] Import existing source code → UML
* [ ] Reverse engineering
* [ ] More programming languages
* [ ] Custom code templates
* [ ] Undo/Redo
* [ ] Collaborative diagram editing
* [ ] Persistent project storage
* [ ] AI-assisted UML generation

---

## 📜 License

This project is developed for educational and software-development purposes.

---

## 👨‍💻 Author

**Viraj Desai**

GitHub:
https://github.com/vrd2003/ClassToCode

---

## ⭐ Support

If you find **ClassToCode** useful, consider giving the repository a ⭐ on GitHub.

---

### ClassToCode

**Design it. Model it. Generate it.**
