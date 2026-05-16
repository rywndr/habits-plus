# Habits+

An inclusive app that is made for the purpose of enabling teachers monitor the growth progress of students that are diagnosed with autism. The data collected that is used to build this app are collected from 8 different Special Needs School (SLB) across 2 regions in Kepulauan Riau (Kepri).

## The plan

Tech-stack planned for the app:

- Next.js
- PostgrSQL
- Drizzle ORM
- Better Auth
- Vercel + NeonDB

^ Subject to change if private hosting is needed (I don't pay for Vercel hosting :D)

## Schema plan

It is not guaranteed but there is a possibility later on that multiple schools will be using this app. So multi-tenant design is implemented in case this does happens.

```
School
  └── Admin (manages teachers + students per school)
       └── Teacher
            └── Class
                 └── Student
                      └── Observation (daily)
                      └── WeeklyNote
  └── Parent (linked to specific Student)
```
