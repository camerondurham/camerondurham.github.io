---
title: SQL
classes: wide
sidebar:
  nav: "memos"
permalink: /sql/
---

## Commands tldr

Important SQL commands:

| `COMMAND` | description |
:---- | :-----
`SELECT` | extract data from database
`UPDATE` | updates data in a database
`DELETE` | deletes data from a database
`INSERT INTO` | inserts new data into a database
`CREATE DATABASE` | creates a new database
`ALTER DATABASE` | modifies data in a database
`CREATE TABLE` | create a table
`DROP TABLE` | deletes a table
`ALTER TABLE` | modifies a table
`DROP INDEX` | deletes an index

## Creating Tables

Creating tables in a relational database requires you constrain a key to uniquely identify a record in the table. This key will be used to query the item either by you or by the database server when you make requests.

```sql
-- in SQL Server / Oracle
CREATE TABLE users (
    ID int NOT NULL PRIMARY KEY,
    LNAME varchar(255) NOT NULL,
    FNAME varchar(255),
    AGE int
);

-- in MySQL
CREATE TABLE users (
    ID int NOT NULL,
    LNAME varchar(255) NOT NULL,
    FNAME varchar(255),
    AGE int,
    PRIMARY KEY (ID)
);
```

A table may only have **one** primary key but in the table, a primary key can use multiple columns to be a unique identifier. For example, you could use first and last name as primary keys.

```sql
CREATE TABLE PROJECTMEMBER (
    LNAME varchar(255) NOT NULL,
    FNAME varchar(255) NOT NULL,
    TASKS varchar(255)
    CONSTRAINT member PRIMARY KEY(LNAME, FNAME)
);
```

To create an auto-incrementing index, you can use the following:

```sql
-- MySQL
CREATE TABLE users (
    ID int NOT NULL AUTO_INCREMENT,
    LNAME varchar(255) NOT NULL,
    FNAME varchar(255),
    AGE int,
    PRIMARY KEY (ID)
);

-- set the AUTO_INCREMENT value to start with a value other than 1
ALTER TABLE users AUTO_INCREMENT=42;
```

You must `CREATE SEQUENCE` in Oracle since you'll be defining an object that can have more configurable behavior. For example:

```sql
CREATE SEQUENCE seq_user
MINVALUE 0
START WITH 0
INCREMENT BY 2
CACHE 10;
```

This code creates an object sequence `0, 2, 4, ...`. The cache setting of 10 will increase performance by storing sequence values in memory. Since these are sequences, you'll only create a given value once. If an item is given index `4`, you delete it, then immediately re-insert something, it will be given the next value in the sequence. Hence, you might have unused indices in your table that are taking up extra space.

### `SELECT`

In `SELECT`, `UPDATE`, `DELETE`, and other statements, a `WHERE` clause can be used to specify a condition.

For example:

```sql
-- specify table name as a condition
SELECT * FROM ALL_TABLES WHERE TABLE_NAME='CUSTOMERS';
```

The following operators can be used in the `WHERE` clause:

| operator | description |
:---:|:----
=|Equal
>|greater than
<|less than
>=|greater or equal to
<=|less or equal to
<>|not equal (**note** some SQL versions may instead use !=)
BETWEEN|between a range
LIKE|search for pattern
IN|specify multiple possible values for a column


```sql
SELECT * FROM Customers
WHERE CustomerID BETWEEN 40 AND 60;
```


Syntax:

```sql
-- Select columns from a database
SELECT <COLUMN 1>, <COLUMN 2>, ...
FROM <TABLENAME>;

-- Select distinct

SELECT DISTINCT <COLUMN 1>, <COLUMN 2>, ...
FROM <TABLENAME>;

-- Delete all rows in a table
DELETE <TABLENAME>;

-- Remove table
DROP <TABLENAME>;

-- Remove table with constraints
DROP TABLE <TABLENAME> CASCADE CONSTRAINTS;

```

### Admin Commands

```sql
-- create a tablespace in given datafile location
CREATE TABLESPACE
        EXAMPLE
DATAFILE
        '/u01/app/oracle/oradata/ORCLCDB/orcl/example01.dbf'
SIZE
        100m;

```

## Aggregate Functions: `COUNT`, `AVG`, `SUM`

SQL functions like `COUNT`, `AVG`, and `SUM` are exciting since they allow you to get information about data from across an entire table.

Examples coming soon!

## `GROUP BY`

From https://app.mode.com.

```sql
SELECT year, month, COUNT(*) AS count FROM tutorial.aapl_historical_stock_price GROUP BY year, month
```

Calculating the total number of shares traded each month, ordered chronologically:

```sql
SELECT year,
month,
       sum(volume) AS traded
FROM tutorial.aapl_historical_stock_price
GROUP BY year,
month
ORDER BY year
```

Order of column names in `GROUP BY` clauses doesn't matter. Order of clauses in `ORDER BY` do, however, do. As you'd expect, they change which column is sorted first.

A powerful use of grouping and aggregate functions is the ability to group data together to analyze changes over time. For example, here's how you'd calculate the average daily price change in Apple stock, grouped and ordered by year:

```sql
SELECT year,
       avg(close - open) AS avg_change
FROM tutorial.aapl_historical_stock_price
GROUP BY year
ORDER BY year;
```

A SQL query that calculates the highest and lowest prices of Apple stock each month.

```sql
SELECT year, month, max(high) as highest, min(low) as lowest
FROM tutorial.aapl_historical_stock_price
GROUP BY month, year
ORDER BY year, month;
```

## `HAVING` clause


## Subqueries

Subqueries allow you to pre-select some data that meets some conditions. This is used to speed up your SQL queries and should be using if you are working with large datasets.

The simplest subquery is kind of useless and similar to normal column selecting:

```sql
-- simple subquery using the FROM statement
SELECT DATES, DOCNUM
FROM (SELECT * FROM AUDITS)
, DOCUMENTS;

-- slightly more useful by preselecting
--      data that meets some conditions
SELECT DATES, DOCNUM
FROM (SELECT * FROM AUDITS WHERE ACTIONID > 2000 )
, DOCUMENTS;
```

Subqueries are useful when you need a unique id from another table. For example:

```sql
insert into tasks(user_id, task) values(
    (select id from users where name='Austin'),
    'write blog post about vim regex'
)

```

## JOIN

The `JOIN` command combine tables together like intersection and union work on sets.

### INNER JOIN

Inner joins work like intersection. `JOIN` commands are `INNER JOIN` by default.

```sql
-- inner join
SELECT StudentCourse.CourseID,Student.StudentName
FROM Student
INNER JOIN StudentCourse
ON StudentCourse.EnrollNo = Student.EnrollNo
ORDER BY StudentCourse.CourseID
```

For example, on a project I'm currently working on, we want to pull information from forms if they exist but might not have been updated in the tasks database. Here's that query:

```sql
SELECT CONTENT FROM TASKS
RIGHT JOIN FIELDS ON TASKS.TEXTATTRIBUTE5 = FIELDS.CONTENT ;
```

### OUTER JOIN

Outer joins include elements from one set and can include elements in one of the other sets. There are three types of outer joins:

1. Full outer join (union)
2. Left outer join (include items also in 'left' set)
3. Right outer join (inlcude items also in 'right' set)

Examples: (from https://geeksforgeeks.org/inner-join-vs-outer-join)

```sql
-- left outer join
SELECT Student.StudentName,
       StudentCourse.CourseID
FROM Student
LEFT OUTER JOIN StudentCourse
ON StudentCourse.EnrollNo = Student.EnrollNo
ORDER BY StudentCourse.CourseID

-- right outer join
-- just s/LEFT/RIGHT/g
SELECT Student.StudentName,
       StudentCourse.CourseID
FROM Student
RIGHT OUTER JOIN StudentCourse
ON StudentCourse.EnrollNo = Student.EnrollNo
ORDER BY StudentCourse.CourseID

-- full outer join includes results from both left and right
```


## Data Types

SQL has a built in system to determine the compiletime type of an expression. Each type has a value associated with it that can be `NULL` if allowed in the table schema. Below is a table of some commonly used SQL data types. A complete list can be found [on apache's website for Derby DB](https://builds.apache.org/job/Derby-docs/lastSuccessfulBuild/artifact/trunk/out/ref/crefsqlj31068.html).

`TYPE` | description | example
:---: | :---- | :----
`BLOB`  | binary large object up to 2,147,483,647 characters long| (large files)
`BOOLEAN`  | 1-byte boolean value | `values true`
`DATE`  | stores date in different formats | `VALUES DATE('2019-07-19')`
`INTEGER`  | stores integer values corresponding to `java.lang.Integer` | `3344`
`NUMERIC`  | synonym for `DECIMAL`, which provides exact numeric value to arbitrarily sized prcision | `123.456`
`TIME`  | time-of-day value corresponsing to `java.sql.Time` | `VALUES TIME('15:08:02')`
`TIMESTAMP`  | provides both time and date stamp | `VALUES '2019-07-19 12:34:00', TIMESTAMP('1999-03-04 23.33.33')`
`VARCHAR`  | variable-length string storage max length is 32,672 characters | `VALUES 'my name is john'`

## Dates


### Date formatting

To input date values, use the SQL function `TO_DATE`:

```sql
TO_DATE('2019-07-15','YYYY-MM-DD')
```

### Timestamp

The `TIMESTAMP` data type is a `DATE` type with extra functionality.

To compare a `DATE` and `TIMESTAMP` values, make sure they are the same type by using the `TO_TIMESTAMP` function.

```sql
-- select values with a date from table column with timestamp values
SELECT * FROM TASKS WHERE CREATEDDATE BETWEEN TO_TIMESTAMP('11/04/2018', 'DD/MM/YYYY') AND TO_TIMESTAMP('04/14/2019', 'DD/MM/YYYY')
```

The benefit of timestamps is it records fractional seconds.

If you really wanted to, you could select with incredible precision if you cared about that sorta thing:

```sql

SELECT * FROM TASKS
WHERE CREATEDDATE BETWEEN
TO_TIMESTAMP('11/04/2018 12.34.56.78', 'DD/MM/YYYY HH24:MI:SS:FF') AND
TO_TIMESTAMP('04/14/2019 12.34.56.78', 'DD/MM/YYYY HH24:MI:SS:FF')
```

## CASE

Syntax:
```sql
CASE <column> WHEN 'VALUE' THEN <another_column/another_value> END
```

Example:

```sql
case FIELDNAME when 'InvoiceDate' then CONTENT end
case FIELDNAME when 'InvoiceDate' then '11/22/34 12:34:56.78' end
```

Using in a more advanced case:

```sql
SELECT CASE traffic_light
           WHEN 300 then 'RED'
           WHEN 500 then 'YELLOW'
           WHEN 800 then 'GREEN'
       END AS light,
       COUNT(*) AS COUNT
FROM street s,
     car c
WHERE s.coords = c.coords
GROUP BY light
```

Another "advanced" join that took me a while to merge properly:

```sql
SELECT d.DATEIMPORTSTARTRTS AS "Scan Date",
       d.documentnumber AS "DOCUMENT NUMBER",
       d.org_id AS "Org ID",
       d.batchname AS "Batch Name",
       fields.T1 AS "Invoice #",
       fields.T2 AS "Invoice Date",
       fields.T3 AS "Invoice Total",
       fields.T4 AS "Invoice Type",
       fields.T5 AS "PO",
       fields.T6 AS "Supplier Number",
       fields.T7 AS "Supplier Name"
FROM
  (SELECT T0,
          T1,
          T2,
          T3,
          T4,
          T5,
          T6,
          T7,
          DN
   FROM
       (SELECT T.TEXTATTRIBUTE8 AS T0,
               documentnumber AS DN,
               MAX(CASE f.fieldname
                       WHEN 'InvoiceNumber' then f.contentrts
                   END) AS T1,
               MAX(CASE f.fieldname
                       WHEN 'InvoiceDate' then f.contentrts
                   END) AS T2,
               MAX(CASE f.fieldname
                       WHEN 'AmountTotal' then f.contentrts
                   END) AS T3,
               MAX(CASE f.fieldname
                       WHEN 'InvoiceType' then f.contentrts
                   END) AS T4,
               MAX(CASE f.fieldname
                       WHEN 'PONumber' then f.contentrts
                   END) AS T5,
               MAX(CASE f.fieldname
                       WHEN 'VendorID' then f.contentrts
                   END) AS T6,
               MAX(CASE f.fieldname
                       WHEN 'VendorASSA' then f.contentrts
                   END) AS T7
      FROM OFRFIELDS f
      LEFT JOIN WFTASK t
        ON f.documentnumber = t.textattribute8
      GROUP BY f.DOCUMENTNUMBER,
               T.TEXTATTRIBUTE8) fields
   left join wftask t

     ON fields.T0= t.textattribute8) fields,
     ofrdocument d

WHERE d.documentnumber=fields.T0
  AND fields.DN = d.documentnumber
```

## Troubleshooting

### ORA-00942: table or view does not exist

This error can be insufficient permissions for a database user, or there is not a public synonym for the given table. Also, if you grant permission or alter a session, try exiting the session so changes sync with the database.

To find the owner of a table, try executing the query:

```sql
select owner, table_name from all_tables where table_name='TABLE_NAME';
```
