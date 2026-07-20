## Question Template
### 1
Given a matrix that contains only 1s and 0s, find the largest cross which contains only 1s, with the same arm lengths and the four arms joining at the central point.

Return the arm length of the largest cross.

Assumptions

The given matrix is not null, has size of N * M, N >= 0 and M >= 0.
Examples

{ {0, 0, 0, 0},

  {1, 1, 1, 1},

  {0, 1, 1, 1},

  {1, 0, 1, 1} }

the largest cross of 1s has arm length 2.

### 2
Given two strings of alphanumeric characters, determine the minimum number of Replace, Delete, and Insert operations needed to transform one string into the other.

Assumptions

Both strings are not null
Examples

string one: “sigh”, string two : “asith”

the edit distance between one and two is 2 (one insert “a” at front then replace “g” with “t”).

### 3 
Given two nodes in a binary tree, find their lowest common ancestor.

Assumptions

There is no parent pointer for the nodes in the binary tree

The given two nodes are guaranteed to be in the binary tree

Examples

        5

      /   \

     9     12

   /  \      \

  2    3      14

The lowest common ancestor of 2 and 14 is 5

The lowest common ancestor of 2 and 9 is 9

